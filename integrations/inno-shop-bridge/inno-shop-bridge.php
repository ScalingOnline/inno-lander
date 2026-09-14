<?php
/**
 * Plugin Name: Inno Aminos Shop Bridge
 * Description: Signed storefront-to-WooCommerce checkout handoff, volume offers, research acknowledgements, and contact delivery. NMI stays in native WooCommerce checkout.
 * Version: 1.0.0
 * Requires PHP: 7.4
 * Requires Plugins: woocommerce
 */
if (!defined('ABSPATH')) { exit; }

function inno_shop_catalog() {
    return array(
        'inno-3-rt' => array('name' => 'INNO-3 RT', 'ids' => array(561, 562, 563)),
        'tesamorelin' => array('name' => 'Tesamorelin', 'ids' => array(583)),
        'mots-c' => array('name' => 'MOTS-c', 'ids' => array(573)),
        'klow' => array('name' => 'KLOW', 'ids' => array(4881)),
        'wolverine' => array('name' => 'The Wolverine Pack', 'ids' => array(116)),
        'reconstitution-solution' => array('name' => 'Amino BAC Water', 'ids' => array(1287), 'accessory' => true),
    );
}
register_activation_hook(__FILE__, function () {
    if (!get_option('inno_shop_bridge_secret')) { add_option('inno_shop_bridge_secret', wp_generate_password(64, false, false), '', 'no'); }
});
add_action('admin_menu', function () {
    add_submenu_page('woocommerce', 'Inno Shop Connection', 'Inno Shop Connection', 'manage_woocommerce', 'inno-shop-connection', 'inno_shop_settings');
});
function inno_shop_settings() {
    if (!current_user_can('manage_woocommerce')) { return; }
    echo '<div class="wrap"><h1>Inno Shop Connection</h1><p>The frontend requires this value as its server-only INNO_WOO_BRIDGE_SECRET. Never put it in public JavaScript.</p><input id="inno-secret" type="password" readonly style="width:620px;max-width:100%" value="' . esc_attr(get_option('inno_shop_bridge_secret')) . '"><button class="button" type="button" onclick="const e=document.getElementById(\'inno-secret\');e.type=e.type===\'password\'?\'text\':\'password\'">Show / hide</button><h2>One-time purchases</h2><p>Ready after the matching frontend connection secret is configured. This plugin transfers a validated bag to native WooCommerce checkout; it never processes cards or places orders itself.</p><h2>Subscriptions</h2><p>Subscription checkout is intentionally disabled until an adapter for the installed WooCommerce subscription extension is registered. Read README.md. Do not launch recurring offers until the NMI gateway supports the extension and renewal tests pass.</p><h2>Order acknowledgements</h2><p>The bridge requires researcher, Terms, and MTA acknowledgements. It also records them on the native checkout order. These are customer attestations, not identity verification.</p></div>';
}
function inno_shop_forget_nonce($key) { delete_option($key); }
add_action('inno_shop_forget_nonce', 'inno_shop_forget_nonce', 10, 1);
function inno_shop_permission($request) {
    $secret = get_option('inno_shop_bridge_secret');
    $timestamp = $request->get_header('X-Inno-Timestamp');
    $nonce = $request->get_header('X-Inno-Nonce');
    $signature = $request->get_header('X-Inno-Signature');
    if (!$secret || !ctype_digit((string) $timestamp) || abs(time() - intval($timestamp)) > 300 || !preg_match('/^[a-zA-Z0-9-]{16,80}$/', (string) $nonce)) {
        return new WP_Error('inno_auth', 'Invalid storefront authentication.', array('status' => 403));
    }
    $path = '/wp-json' . $request->get_route();
    $data = $timestamp . "\n" . $nonce . "\nPOST\n" . $path . "\n" . $request->get_body();
    if (!hash_equals(hash_hmac('sha256', $data, $secret), (string) $signature)) { return new WP_Error('inno_auth', 'Invalid storefront authentication.', array('status' => 403)); }
    $key = 'inno_nonce_' . hash('sha256', $nonce);
    if (!add_option($key, time(), '', 'no')) { return new WP_Error('inno_replay', 'Request already used.', array('status' => 409)); }
    wp_schedule_single_event(time() + 600, 'inno_shop_forget_nonce', array($key));
    return true;
}
add_action('rest_api_init', function () {
    foreach (array('handoff', 'contact', 'catalog') as $action) {
        register_rest_route('inno-headless/v1', '/' . $action, array('methods' => 'POST', 'callback' => $action === 'catalog' ? 'inno_shop_catalog_response' : 'inno_shop_' . $action, 'permission_callback' => 'inno_shop_permission'));
    }
});
function inno_shop_error($message, $status = 400) { return new WP_Error('inno_checkout', $message, array('status' => $status)); }
function inno_shop_catalog_response() {
    if (!function_exists('wc_get_product')) { return inno_shop_error('WooCommerce is not available.', 503); }
    $result = array();
    foreach (inno_shop_catalog() as $slug => $entry) {
        $variants = array();
        foreach ($entry['ids'] as $id) {
            $p = wc_get_product($id);
            $variants[] = array('price' => $p ? intval(round(floatval($p->get_regular_price()) * 100)) : null, 'available' => $p && $p->is_in_stock() && $p->is_purchasable());
        }
        $result[] = array('slug' => $slug, 'variants' => $variants);
    }
    return array('products' => $result, 'currency' => get_woocommerce_currency());
}
function inno_shop_validate_lines($body) {
    $catalog = inno_shop_catalog();
    $offer = $body['offer'] ?? 'shop';
    if (!in_array($offer,array('shop','box','get','rt'),true)) { return inno_shop_error('Invalid offer.'); }
    $lines = isset($body['lines']) ? $body['lines'] : array();
    if (!is_array($lines) || count($lines) < 1 || count($lines) > 30) { return inno_shop_error('Your bag is empty or too large.'); }
    $normalized = array(); $stock_counts = array(); $total_count = 0;
    foreach ($lines as $line) {
        $slug = isset($line['slug']) ? (string) $line['slug'] : '';
        $variant = isset($line['variant']) ? $line['variant'] : null;
        $quantity = isset($line['quantity']) ? $line['quantity'] : null;
        $plan = isset($line['plan']) ? $line['plan'] : '';
        if (!isset($catalog[$slug]) || !is_int($variant) || !isset($catalog[$slug]['ids'][$variant]) || !is_int($quantity) || $quantity < 1 || $quantity > 99 || !in_array($plan, array('once', 'monthly', 'quarterly'), true)) { return inno_shop_error('Invalid product selection.'); }
        $accessory = !empty($catalog[$slug]['accessory']);
        if ($offer !== 'shop' && (($plan !== 'once' && !($offer === 'rt' && $plan === 'monthly')) || $accessory)) { return inno_shop_error('Choose a supported peptide offer and delivery schedule.'); }
        if ($offer === 'rt' && $slug !== 'inno-3-rt') { return inno_shop_error('This offer is for GLP-3 only.'); }
        if ($accessory && $plan !== 'once') { return inno_shop_error('Amino BAC Water is a one-time product.'); }
        $id = $catalog[$slug]['ids'][$variant];
        $product = wc_get_product($id);
        if (!$product || !$product->is_purchasable() || !$product->is_in_stock()) { return inno_shop_error($catalog[$slug]['name'] . ' is currently unavailable.'); }
        $adapter = array();
        if ($plan !== 'once') {
            // The adapter must use the installed extension's real purchase-plan metadata.
            // Never invent recurring schedules or launch a second billing system in NMI.
            $adapter = apply_filters('inno_shop_subscription_adapter', null, $id, $plan, $quantity, $offer);
            if (!is_array($adapter) || empty($adapter['validated']) || empty($adapter['cart_item_data']) || !is_array($adapter['cart_item_data'])) {
                return inno_shop_error('Subscription checkout is not enabled yet. Choose a one-time purchase or contact our team.', 409);
            }
            if (isset($adapter['product_id']) && intval($adapter['product_id']) !== $id) { return inno_shop_error('Subscription adapter must preserve the source product and inventory.', 409); }
        }
        $stock_counts[$id] = isset($stock_counts[$id]) ? $stock_counts[$id] + $quantity : $quantity;
        $total_count += $quantity;
        $normalized[] = array('slug' => $slug, 'variant' => $variant, 'id' => $id, 'quantity' => $quantity, 'plan' => $plan, 'accessory' => $accessory, 'offer' => $offer, 'adapter' => $adapter);
    }
    if ($offer === 'get') {
        $merged = array();
        foreach ($normalized as $line) {
            $line_key = $line['slug'] . ':' . $line['variant'];
            if (isset($merged[$line_key])) { $merged[$line_key]['quantity'] += $line['quantity']; }
            else { $merged[$line_key] = $line; }
        }
        $normalized = array_values($merged);
    }
    if ($offer === 'box' && $total_count > 5) { return inno_shop_error('Choose up to five items for your box.'); }
    if ($offer === 'get' && !in_array($total_count,array(2,3),true)) { return inno_shop_error('Choose any two or three peptide vials.'); }
    if ($offer === 'rt' && count($normalized) !== 1) { return inno_shop_error('Choose one GLP-3 vial size.'); }
    if ($total_count > 300) { return inno_shop_error('Contact our team for orders over 300 items.'); }
    $plan_counts = array('once'=>0,'monthly'=>0,'quarterly'=>0);
    foreach ($normalized as $line) { if (!$line['accessory']) { $plan_counts[$line['plan']] += $line['quantity']; } }
    $extra_bac = in_array($offer,array('shop','box','rt'),true) ? count(array_filter($plan_counts, function ($count) { return $count >= 3; })) : 0;
    if (!$extra_bac && array_sum($plan_counts) > 0 && !empty($body['bacAddon'])) { $extra_bac = 1; }
    if ($extra_bac) {
        $bac = wc_get_product(1287);
        if (!$bac || !$bac->is_in_stock() || !$bac->is_purchasable()) { return inno_shop_error('Amino BAC Water for this offer is currently unavailable. Please contact our team.'); }
        $stock_counts[1287] = ($stock_counts[1287] ?? 0) + $extra_bac;
    }
    foreach ($stock_counts as $id => $count) { if (!wc_get_product($id)->has_enough_stock($count)) { return inno_shop_error('One of the requested quantities exceeds current stock.'); } }
    return $normalized;
}
function inno_shop_handoff($request) {
    if (!function_exists('WC')) { return inno_shop_error('WooCommerce is unavailable.', 503); }
    if (strlen($request->get_body()) > 24000) { return inno_shop_error('Request is too large.'); }
    $body = $request->get_json_params();
    if (empty($body['terms']) || empty($body['mta']) || empty($body['researcherAttestation'])) { return inno_shop_error('Researcher, Terms, and MTA acknowledgements are required.'); }
    $lines = inno_shop_validate_lines($body);
    if (is_wp_error($lines)) { return $lines; }
    $address = isset($body['address']) && is_array($body['address']) ? $body['address'] : array();
    foreach (array('first_name', 'last_name', 'company', 'address_1', 'city', 'state', 'postcode') as $field) { if (empty($address[$field]) || !is_string($address[$field]) || strlen($address[$field]) > 200) { return inno_shop_error('Complete the contact and laboratory address.'); } }
    if (!is_email($address['email'] ?? '') || ($address['country'] ?? '') !== 'US' || !preg_match('/^\d{5}(-\d{4})?$/', (string) $address['postcode'])) { return inno_shop_error('Check the email and U.S. shipping address.'); }
    $clean = array();
    foreach (array('first_name','last_name','email','phone','company','address_1','address_2','city','state','postcode','country') as $field) { $clean[$field] = sanitize_text_field($address[$field] ?? ''); }
    $ticket = bin2hex(random_bytes(24));
    set_transient('inno_ticket_' . $ticket, array('lines' => $lines, 'offer' => $body['offer'] ?? 'shop', 'address' => $clean, 'bacAddon' => !empty($body['bacAddon']), 'expires' => time() + 300), 300);
    return array('checkout_url' => add_query_arg('inno_shop_ticket', $ticket, home_url('/')));
}
add_action('template_redirect', function () {
    if (!isset($_POST['inno_shop_ticket']) && !isset($_GET['inno_shop_ticket'])) { return; }
    nocache_headers(); header('Referrer-Policy: no-referrer');
    $allowed_origins = apply_filters('inno_shop_allowed_origins', array('https://shop.innoaminos.com','https://box.innoaminos.com','https://get.innoaminos.com','https://rt.innoaminos.com','https://inno-aminos-shop.jshklb.chatgpt.site','https://inno-aminos-box.jshklb.chatgpt.site','https://inno-aminos-get.jshklb.chatgpt.site','https://inno-aminos-rt.jshklb.chatgpt.site'));
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? trim($_SERVER['HTTP_ORIGIN']) : '';
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST' || !in_array($origin,$allowed_origins,true)) { wp_die('Please return to your shop bag and continue through secure checkout.', 'Checkout origin required', array('response'=>403)); }
    $ticket = sanitize_text_field(wp_unslash($_POST['inno_shop_ticket']));
    if (!preg_match('/^[a-f0-9]{48}$/', $ticket)) { wp_die('Invalid checkout link. Please return to your shop bag.', 'Checkout unavailable', array('response' => 400)); }
    $payload = get_transient('inno_ticket_' . $ticket);
    if (!$payload || $payload['expires'] < time()) { wp_die('This checkout link has expired. Please return to your shop bag and try again.', 'Checkout link expired', array('response' => 410)); }
    $used_key = 'inno_used_' . $ticket;
    if (!add_option($used_key, time(), '', 'no')) { wp_die('This checkout link has already been used.', 'Checkout link used', array('response' => 409)); }
    wp_schedule_single_event(time() + 600, 'inno_shop_forget_nonce', array($used_key));
    delete_transient('inno_ticket_' . $ticket);
    if (!function_exists('WC') || !function_exists('wc_load_cart')) { wp_die('WooCommerce is unavailable.'); }
    wc_load_cart();
    // Recheck product availability and adapters immediately before replacing a cart.
    $recheck = inno_shop_validate_lines(array('lines'=>$payload['lines'],'bacAddon'=>$payload['bacAddon'],'offer'=>$payload['offer']??'shop'));
    if (is_wp_error($recheck)) { wp_die(esc_html($recheck->get_error_message()), 'Please review your bag', array('response'=>409)); }
    $payload['lines'] = $recheck;
    WC()->session->set_customer_session_cookie(true);
    $previous_cart = WC()->cart->get_cart();
    $previous_removed = WC()->cart->get_removed_cart_contents();
    $previous_coupons = WC()->cart->get_applied_coupons();
    $previous_attestation = WC()->session->get('inno_shop_attested');
    $previous_addon = WC()->session->get('inno_shop_bac_addon');
    $previous_shipping = WC()->session->get('chosen_shipping_methods');
    WC()->cart->empty_cart(false);
    WC()->session->set('inno_shop_attested', array('time' => time(), 'terms' => true, 'mta' => true, 'researcher' => true));
    WC()->session->set('inno_shop_bac_addon', !empty($payload['bacAddon']));
    foreach ($payload['lines'] as $line) {
        $p = wc_get_product($line['id']);
        $meta = isset($line['adapter']['cart_item_data']) ? $line['adapter']['cart_item_data'] : array();
        $meta['_inno_shop'] = array('slug' => $line['slug'], 'base_id' => $line['id'], 'plan' => $line['plan'], 'accessory' => $line['accessory'], 'offer' => $line['offer'] ?? 'shop');
        $variation_id = $p && $p->is_type('variation') ? $p->get_id() : 0;
        $product_id = $variation_id ? $p->get_parent_id() : $line['id'];
        $attributes = $variation_id ? $p->get_variation_attributes() : array();
        if (!WC()->cart->add_to_cart($product_id, $line['quantity'], $variation_id, $attributes, $meta)) {
            WC()->cart->set_cart_contents($previous_cart);
            WC()->cart->set_removed_cart_contents($previous_removed);
            WC()->cart->set_applied_coupons($previous_coupons);
            WC()->session->set('inno_shop_attested', $previous_attestation);
            WC()->session->set('inno_shop_bac_addon', $previous_addon);
            WC()->session->set('chosen_shipping_methods', $previous_shipping);
            WC()->cart->calculate_totals();
            WC()->cart->set_session();
            WC()->cart->persistent_cart_update();
            wc_add_notice('An item could not be added. Your previous WooCommerce bag has been restored. Please return to the shop and review your selection.', 'error');
            wp_safe_redirect(wc_get_cart_url()); exit;
        }
    }
    foreach ($payload['address'] as $field => $value) {
        $billing_setter = 'set_billing_' . $field;
        if (is_callable(array(WC()->customer, $billing_setter))) { WC()->customer->$billing_setter($value); }
        $shipping_setter = 'set_shipping_' . $field;
        if ($field !== 'email' && $field !== 'phone' && is_callable(array(WC()->customer, $shipping_setter))) { WC()->customer->$shipping_setter($value); }
    }
    WC()->customer->save();
    WC()->cart->calculate_totals();
    WC()->cart->set_session();
    WC()->cart->persistent_cart_update();
    wp_safe_redirect(wc_get_checkout_url()); exit;
});
function inno_shop_is_renewal_cart() {
    return function_exists('wcs_cart_contains_renewal') && wcs_cart_contains_renewal();
}
function inno_shop_rate($count, $plan, $offer = 'shop') {
    if ($offer === 'rt' && $plan === 'monthly') { $rt_rates=array(25,30,40); return $count>0?$rt_rates[min($count,3)-1]:0; }
    if ($offer === 'box') { $box_rates=array(15,20,30,35,40); return $count>0?$box_rates[min($count,5)-1]:0; }
    $rates = array('once'=>array(15,20,30),'monthly'=>array(20,25,35),'quarterly'=>array(30,35,40));
    return $count > 0 && isset($rates[$plan]) ? $rates[$plan][min($count,3)-1] : 0;
}
add_action('woocommerce_before_calculate_totals', function ($cart) {
    static $working = false;
    if ($working || inno_shop_is_renewal_cart() || (is_admin() && !wp_doing_ajax())) { return; }
    if (!empty($cart->recurring_cart_key)) { return; }
    foreach ($cart->get_cart() as $item) { if (isset($item['subscription_renewal'])) { return; } }
    $working = true;
    try {
        $counts = array('once'=>0,'monthly'=>0,'quarterly'=>0); $present = array(); $has_shop = false; $offer='shop';
        foreach ($cart->get_cart() as $key=>$item) {
            if (empty($item['_inno_shop'])) { continue; }
            $has_shop = true; $meta=$item['_inno_shop']; $offer=$meta['offer']??'shop';
            if (empty($meta['accessory']) && empty($meta['gift']) && empty($meta['addon']) && isset($counts[$meta['plan']])) { $counts[$meta['plan']] += $item['quantity']; }
        }
        if (!$has_shop) { return; }
        $get_discount_key = null; $get_discount_cents = 0;
        if ($offer === 'get' && in_array(array_sum($counts), array(2,3))) {
            $candidates = array();
            foreach ($cart->get_cart() as $candidate_key => $candidate_item) {
                $meta = $candidate_item['_inno_shop'] ?? array();
                if (($meta['offer'] ?? 'shop') !== 'get' || !empty($meta['accessory']) || !empty($meta['gift']) || !empty($meta['addon'])) { continue; }
                $source = wc_get_product(intval($meta['base_id']));
                if (!$source) { continue; }
                $candidates[] = array('key'=>$candidate_key, 'base'=>intval(round(floatval($source->get_regular_price())*100)), 'slug'=>$meta['slug'], 'id'=>intval($meta['base_id']));
            }
            usort($candidates, function($a,$b) { return ($a['base'] <=> $b['base']) ?: (strcmp($a['slug'],$b['slug']) ?: ($a['id'] <=> $b['id'])); });
            if ($candidates) {
                $cheapest = $candidates[0]; $get_discount_key = $cheapest['key'];
                $get_discount_cents = array_sum($counts) == 3 ? $cheapest['base'] : $cheapest['base'] - intval(round($cheapest['base']/2));
            }
        }
        foreach ($cart->get_cart() as $key=>$item) {
            if (empty($item['_inno_shop'])) { continue; }
            $meta = $item['_inno_shop']; $plan = $meta['plan'];
            if (!empty($meta['gift'])) {
                if (!in_array($offer,array('shop','box','rt'),true) || empty($counts[$plan]) || $counts[$plan] < 3 || isset($present[$plan])) { $cart->remove_cart_item($key); continue; }
                $present[$plan] = true; $cart->cart_contents[$key]['quantity'] = 1; $item['data']->set_price(0); continue;
            }
            if (!empty($meta['addon'])) { $cart->remove_cart_item($key); continue; }
            $base = wc_get_product(intval($meta['base_id']));
            if (!$base) { continue; }
            $regular = floatval($base->get_regular_price());
            $percent = !empty($meta['accessory']) ? 0 : inno_shop_rate($counts[$plan], $plan, $offer);
            if ($offer === 'get' && empty($meta['accessory'])) {
                $cents=intval(round($regular*100));$q=intval($item['quantity']);
                $total=$cents*$q-($key===$get_discount_key?$get_discount_cents:0);
                $item['data']->set_price($total/100/max(1,$q));
            } else { $item['data']->set_price(round($regular * (100-$percent)/100, wc_get_price_decimals())); }
        }
        $gift_count = 0;
        foreach ($counts as $plan=>$count) {
            if (!in_array($offer,array('shop','box','rt'),true) || $count < 3) { continue; }
            $gift_count++;
            if (!isset($present[$plan])) {
                $gift = wc_get_product(1287);
                if ($gift && $gift->is_in_stock()) { $cart->add_to_cart(1287,1,0,array(),array('_inno_shop'=>array('slug'=>'reconstitution-solution','base_id'=>1287,'plan'=>$plan,'accessory'=>true,'gift'=>true,'offer'=>$offer))); }
            }
        }
        if (!$gift_count && array_sum($counts)>0 && WC()->session && WC()->session->get('inno_shop_bac_addon')) {
            $cart->add_to_cart(1287,1,0,array(),array('_inno_shop'=>array('slug'=>'reconstitution-solution','base_id'=>1287,'plan'=>'once','accessory'=>true,'addon'=>true,'offer'=>$offer)));
        }
        foreach ($cart->get_cart() as $key=>$item) {
            if (!empty($item['_inno_shop']['gift'])) { $item['data']->set_price(0); }
            if (!empty($item['_inno_shop']['addon'])) { $item['data']->set_price(10); }
        }
    } finally { $working=false; }
}, 1000, 1);
add_action('woocommerce_check_cart_items', function () {
    if (!WC()->cart || inno_shop_is_renewal_cart()) { return; }
    $counts=array('once'=>0,'monthly'=>0,'quarterly'=>0);$gifts=array();$addons=0;$has_shop=false;$offer='shop';$offer_lines=0;$offers=array();
    foreach(WC()->cart->get_cart() as $item) {
        if(empty($item['_inno_shop']))continue;
        $has_shop=true;$meta=$item['_inno_shop'];$plan=$meta['plan'];$offer=$meta['offer']??'shop';$offers[$offer]=true;
        if(!empty($meta['gift'])){$gifts[$plan]=true;continue;}
        if(!empty($meta['addon'])){$addons+=$item['quantity'];continue;}
        if(empty($meta['accessory'])&&isset($counts[$plan])){$counts[$plan]+=$item['quantity'];$offer_lines++;}
    }
    $attested=WC()->session ? WC()->session->get('inno_shop_attested') : null;
    if($has_shop&&(!$attested||($attested['time']??0)<time()-86400)){wc_add_notice('Please return to the shop checkout to confirm the research purchasing terms for this order.','error');}
    $total_count=array_sum($counts);
    if(count($offers)>1)wc_add_notice('Offers cannot be combined. Please return to your storefront.','error');
    if($offer==='box'&&$total_count>5)wc_add_notice('A box may contain up to five peptide vials.','error');
    if($offer==='get'&&!in_array($total_count,array(2,3)))wc_add_notice('Choose any two or three peptide vials for this offer.','error');
    if($offer==='rt'&&$offer_lines!==1)wc_add_notice('Choose one GLP-3 offer.','error');
    $missing=false;$required=0;
    foreach($counts as $plan=>$count){if(in_array($offer,array('shop','box','rt'),true)&&$count>=3){$required++;if(empty($gifts[$plan]))$missing=true;}}
    if(!$required&&array_sum($counts)>0&&WC()->session&&WC()->session->get('inno_shop_bac_addon')&&!$addons)$missing=true;
    if($missing){$message='Amino BAC Water for your offer could not be added. Please contact our team before completing this order.';if(!wc_has_notice($message,'error'))wc_add_notice($message,'error');}
});
add_filter('woocommerce_coupon_is_valid', function ($valid) {
    if (inno_shop_is_renewal_cart()) { return $valid; }
    if (WC()->cart) { foreach (WC()->cart->get_cart() as $item) { if (!empty($item['_inno_shop']) && empty($item['_inno_shop']['accessory'])) { return false; } } }
    return $valid;
}, 10, 1);
add_filter('woocommerce_cart_item_name', function ($name,$item) {
    if (!empty($item['_inno_shop']['slug'])) { $catalog=inno_shop_catalog(); $slug=$item['_inno_shop']['slug']; if(isset($catalog[$slug])) { return esc_html(($item['_inno_shop']['offer']??'shop')==='rt'&&$slug==='inno-3-rt'?'GLP-3':$catalog[$slug]['name']); } }
    return $name;
}, 10, 2);
add_action('woocommerce_checkout_create_order_line_item', function ($item,$cart_key,$values) {
    if (empty($values['_inno_shop'])) { return; }
    $meta=$values['_inno_shop']; $catalog=inno_shop_catalog();
    if (isset($catalog[$meta['slug']])) { $item->set_name(($meta['offer']??'shop')==='rt'&&$meta['slug']==='inno-3-rt'?'GLP-3':$catalog[$meta['slug']]['name']); }
    $item->add_meta_data('_inno_shop', $meta, true);
    if (empty($meta['accessory'])) { $item->add_meta_data('Delivery schedule', $meta['plan']==='once'?'One-time':($meta['plan']==='monthly'?'Every month':'Every 3 months'),true); }
}, 10, 3);
function inno_shop_record_attestation($order) {
    if (!WC()->session || !WC()->session->get('inno_shop_attested')) { return; }
    foreach ($order->get_items() as $item) {
        if ($item->get_meta('_inno_shop',true)) { $order->update_meta_data('_inno_research_attestation',WC()->session->get('inno_shop_attested')); return; }
    }
}
add_action('woocommerce_checkout_create_order','inno_shop_record_attestation',10,1);
add_action('woocommerce_store_api_checkout_update_order_meta','inno_shop_record_attestation',10,1);
function inno_shop_finish_acknowledgement($order_or_id) {
    $order=is_object($order_or_id)?$order_or_id:wc_get_order($order_or_id);
    if($order&&$order->get_meta('_inno_research_attestation',true)&&WC()->session){WC()->session->__unset('inno_shop_attested');WC()->session->__unset('inno_shop_bac_addon');}
}
add_action('woocommerce_checkout_order_processed','inno_shop_finish_acknowledgement',10,1);
add_action('woocommerce_store_api_checkout_order_processed','inno_shop_finish_acknowledgement',10,1);
// The validated subscription adapter must create recurring gifts before shipping is quoted.
// It must also preserve contracted renewal prices and handle later plan/quantity changes.
function inno_shop_contact($request) {
    $body=$request->get_json_params();
    $name=sanitize_text_field($body['name']??'');$email=sanitize_email($body['email']??'');$message=sanitize_textarea_field($body['message']??'');
    if(strlen($name)<2||!is_email($email)||strlen($message)<10||strlen($message)>5000) { return inno_shop_error('Enter your name, email and message.'); }
    $subject='Shop inquiry: '.sanitize_text_field($body['subject']??'General question');
    $content="Name: ".$name."\nEmail: ".$email."\nPhone: ".sanitize_text_field($body['phone']??'')."\n\n".$message;
    $sent=wp_mail('support.lab@innoaminos.com',$subject,$content,array('Reply-To: '.$email));
    return $sent ? array('sent'=>true) : inno_shop_error('Message could not be sent. Please email support.lab@innoaminos.com.',502);
}
