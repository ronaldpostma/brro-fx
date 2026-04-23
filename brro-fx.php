<?php
/**
 * Plugin Name: Brro FX
 * Plugin URI:  https://brro.nl/plugins/brro-fx
 * Description: Lightweight class-based motion effects for custom WordPress themes. Uses Vanilla JS, Intersection Observer, and CSS custom properties — no dependencies required.
 * Version:     1.0.0
 * Author:      Ronald Postma (Brro) & Claude (Anthropic)
 * Author URI:  https://brro.nl
 * Text Domain: brro-fx
 * License:     GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

defined( 'ABSPATH' ) || exit;

add_action( 'wp_enqueue_scripts', function () {
	$base = plugin_dir_url( __FILE__ );
	$ver  = '1.0.0';

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
