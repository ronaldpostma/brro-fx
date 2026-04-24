<?php
/**
 * Plugin Name: Brro FX
 * Plugin URI:  https://brro.nl/plugins/brro-fx
 * Description: Lightweight class-based motion effects for custom WordPress themes. Uses Vanilla JS, Intersection Observer, and CSS custom properties — no dependencies required. Standalone class reference and demo: ref/demo.html (or open demo.html in the plugin folder for a redirect).
 * Version:     1.1.0
 * Author:      Ronald Postma (Brro) & Claude (Anthropic)
 * Author URI:  https://brro.nl
 * Text Domain: brro-fx
 * License:     GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

defined( 'ABSPATH' ) || exit;

define( 'BRRO_FX_VERSION', '1.1.0' );

add_action( 'wp_enqueue_scripts', function () {
	$base = plugin_dir_url( __FILE__ );
	$ver  = BRRO_FX_VERSION;

	wp_enqueue_style(
		'brro-fx',
		$base . 'assets/css/brro-fx.css',
		[],
		$ver
	);

	wp_enqueue_script(
		'lenis',
		$base . 'assets/js/lenis.min.js',
		[],
		$ver,
		true
	);

	wp_enqueue_script(
		'brro-fx',
		$base . 'assets/js/brro-fx.js',
		[ 'lenis' ],
		$ver,
		true // load in footer
	);
} );

/**
 * ===============================================
 * UPDATE MECHANISM
 * ===============================================
 */

/**
 * Check for plugin updates from custom endpoint.
 *
 * @param object $checked_data WordPress update data.
 * @return object
 */
function brro_fx_check_for_plugin_update( $checked_data ) {
	if ( empty( $checked_data->checked ) ) {
		return $checked_data;
	}

	$plugin_slug = 'brro-fx';
	$plugin_path = plugin_basename( __FILE__ );

	$response = brro_fx_get_plugin_update_info();

	if (
		$response &&
		isset( $response->new_version ) &&
		isset( $checked_data->checked[ $plugin_path ] ) &&
		version_compare( $checked_data->checked[ $plugin_path ], $response->new_version, '<' )
	) {
		$checked_data->response[ $plugin_path ] = (object) [
			'url'         => isset( $response->url ) ? $response->url : 'https://github.com/ronaldpostma/brro-fx',
			'slug'        => $plugin_slug,
			'package'     => isset( $response->package ) ? $response->package : '',
			'new_version' => $response->new_version,
			'tested'      => isset( $response->tested ) ? $response->tested : '',
		];
	}

	return $checked_data;
}
add_filter( 'pre_set_site_transient_update_plugins', 'brro_fx_check_for_plugin_update' );

/**
 * Fetch plugin update information from JSON endpoint.
 *
 * @return object|false
 */
function brro_fx_get_plugin_update_info() {
	$update_info_url = 'https://www.brro.nl/git-webhook/brro-fx-info.json';

	$response = wp_remote_get(
		$update_info_url,
		[
			'timeout' => 10,
		]
	);

	if ( is_wp_error( $response ) ) {
		return false;
	}

	$body = wp_remote_retrieve_body( $response );
	$data = json_decode( $body );

	if ( ! is_null( $data ) ) {
		return $data;
	}

	return false;
}

/**
 * Add "View changes" link to plugin row meta.
 *
 * @param array  $links Existing plugin row meta links.
 * @param string $file  Plugin file path.
 * @return array
 */
function brro_fx_plugin_row_meta( $links, $file ) {
	if ( $file === plugin_basename( __FILE__ ) ) {
		$new_links = [
			'<a href=\'https://github.com/ronaldpostma/brro-fx/releases\' target=\'_blank\'>' . __( 'View changes', 'brro-fx' ) . '</a>',
		];
		$links = array_merge( $links, $new_links );
	}

	return $links;
}
add_filter( 'plugin_row_meta', 'brro_fx_plugin_row_meta', 10, 2 );
