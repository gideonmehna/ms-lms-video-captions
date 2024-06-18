<?php
/*
Plugin Name: MS LMS Video Captions
Description: Add captions to video lessons by specifying a VTT file URL in a custom field.outcomes.
Version: 1.1
Author: Gideon Mehna
Author URI: https://elyownsoftware.com
Plugin URI: https://elyownsoftware.com/
Text Domain: ms-lms-video-monitor
Domain Path: /languages
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
*/


// Enqueue scripts and styles
function ms_lms_video_captions_assets() {
    wp_enqueue_script('ms-lms-video-captions', plugin_dir_url(__FILE__) . 'js/ms-lms-video-captions.js', array('jquery'), '1.0', true);
    wp_enqueue_style('ms-lms-video-captions', plugin_dir_url(__FILE__) . 'css/ms-lms-video-captions.css', array(), '1.0');
    $post_id = get_queried_object_id();
    if ($post_id == 0) {
        $post_id = get_the_ID();
    }
    $post_data = array(
        'ajax_url' => esc_url(admin_url('admin-ajax.php')),
        'post_id' => esc_js($post_id),
        'security' => wp_create_nonce('fetch_vtt_url_nonce') // Generate nonce
    );
    wp_localize_script('ms-lms-video-captions', 'post_data', $post_data);
}
add_action('wp_enqueue_scripts', 'ms_lms_video_captions_assets');

// Add custom fields to lessons
function ms_lms_custom_fields($custom_fields) {
    $video_lesson_custom_fields = array(
        array(
            'type'    => 'text',
            'name'    => 'vtt-file-url',
            'label'   => __('VTT File URL', 'ms-lms-video-captions'),
            'default' => '',
            'required'=> false,
            'custom_html'=> 'Provide the URL of the VTT file for captions.',
        ),
    );

    return array_merge($custom_fields, $video_lesson_custom_fields);
}
add_filter('masterstudy_lms_lesson_custom_fields', 'ms_lms_custom_fields');

// Function to fetch the VTT URL
function fetch_vtt_url_callback() {
    // Verify nonce
    if (!isset($_POST['security'])) {
        
        wp_send_json_error(array('message' => 'Invalid nonce1.'));
        wp_die();
    }
    if (!!wp_verify_nonce($_POST['security'], 'fetch_vtt_url_nonce')) {
        
        wp_send_json_error(array('message' => 'Invalid nonce.2'));
        wp_die();
    }

    // Get the post ID and custom field name from the AJAX request
    $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;

    if ($post_id) {
        // Get the custom field value
        $custom_field_value = get_post_meta($post_id, 'vtt-file-url', true);

        // Prepare the response
        $response = array(
            'success' => true,
            'vtt_file_url' => esc_url($custom_field_value),
        );
    } else {
        $response = array(
            'success' => false,
            'message' => 'Invalid parameters.',
        );
    }

    // Return the JSON response
    wp_send_json($response);

    // Make sure to exit after sending the response
    wp_die();
}

// Register the AJAX handler
add_action('wp_ajax_fetch_vtt_url', 'fetch_vtt_url_callback');
add_action('wp_ajax_nopriv_fetch_vtt_url', 'fetch_vtt_url_callback'); // Allow non-logged-in users to access the AJAX endpoint

