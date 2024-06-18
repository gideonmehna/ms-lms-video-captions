
window.onload = function() {
    console.log("Window loaded");

    var player = document.querySelector('.plyr__video-embed');
    if (player) {
        // console.log("Player found");

        jQuery.ajax({
            url: post_data.ajax_url,
            type: 'POST',
            data: {
                action: 'fetch_vtt_url',
                post_id: post_data.post_id,
                security: post_data.security
            },
            success: function(response) {
                // console.log("AJAX request successful", response);

                if (response.success) {
                    var vttFileUrl = response.vtt_file_url;
                    if (vttFileUrl) {
                        // console.log("VTT file URL found:", vttFileUrl);

                        var captionContainer = document.createElement('div');
                        captionContainer.className = 'caption';
                        player.appendChild(captionContainer);
                        // console.log("Caption container appended to player");

                        fetch(vttFileUrl)
                            .then(response => {
                                // console.log("VTT file fetch successful");
                                return response.text();
                            })
                            .then(data => {
                                // console.log("VTT file data received");
                                parseVTT(data);
                            })
                            .catch(error => {
                                console.error("Error fetching VTT file:", error);
                            });

                        function parseVTT(data) {
                            // console.log("Parsing VTT data");
                            var captions = {};
                            var lines = data.split('\n');
                            var caption = {};
                            var currentStartTime;

                            lines.forEach(line => {
                                if (line.includes('-->')) {
                                    var times = line.split(' --> ');
                                    currentStartTime = roundTime(parseTime(times[0]));
                                    caption.start = currentStartTime;
                                    caption.end = roundTime(parseTime(times[1]));
                                    // console.log("Parsed caption times:", caption.start, caption.end);
                                } else if (line.trim() === '') {
                                    if (currentStartTime !== undefined) {
                                        captions[currentStartTime] = caption;
                                        // console.log("Caption added:", caption);
                                    }
                                    caption = {};
                                } else {
                                    caption.text = (caption.text ? caption.text + '\n' : '') + line;
                                    // console.log("Caption text updated:", caption.text);
                                }
                            });

                            function displayCaption(time) {
                                var currentTime = roundTime(time);
                                console.log(currentTime);
                                if (captions[currentTime]) {
                                    captionContainer.innerText = captions[currentTime].text;
                                    console.log("Displaying caption:", captions[currentTime].text);
                                } else {
                                    // captionContainer.innerText = '';
                                    console.log("No caption to display at current time:", currentTime);
                                }
                            }
                            window.addEventListener('message', function(event) {
                                let eventData;
                
                                if (typeof event.data === 'string') {
                                    try {
                                        eventData = JSON.parse(event.data);
                                    } catch (e) {
                                        console.error('Failed to parse event data:', e);
                                        return;
                                    }
                                } else {
                                    eventData = event.data;
                                }
                
                                if (eventData.event === 'infoDelivery' && eventData.info && eventData.info.currentTime) {
                                    displayCaption(eventData.info.currentTime);
                                }
                            });

                            // setInterval(displayCaption, 500);
                            // console.log("Caption display interval set");
                        }

                        function parseTime(time) {
                            // console.log("Parsing time:", time);
                            var parts = time.split(':');
                            var seconds = parts.pop();
                            var minutes = parts.pop();
                            var hours = parts.length ? parts.pop() : 0;
                            var parsedTime = parseFloat(hours) * 3600 + parseFloat(minutes) * 60 + parseFloat(seconds);
                            // console.log("Parsed time:", parsedTime);
                            return parsedTime;
                        }

                        function roundTime(time) {
                            // Round to the nearest second
                            return Math.round(time);
                        }
                    } else {
                        console.error("No VTT file URL found in response");
                    }
                } else {
                    console.error("Response indicates failure", response);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error("AJAX request failed", textStatus, errorThrown);
            }
        });
    } else {
        console.error("Player not found");
    }
};


//===========================================

// Load the YouTube IFrame Player API code asynchronously
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

function onYouTubeIframeAPIReady() {
    var player;
    var interval;
    var captions = {};
    var captionContainer;

    window.onload = function() {
        console.log("Window loaded");

        var playerElement = document.querySelector('.plyr__video-embed iframe');
        if (playerElement) {
            // Initialize the YouTube player
            player = new YT.Player(playerElement.id, {
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange
                }
            });
        } else {
            console.error("Player not found");
        }
    };

    function onPlayerReady(event) {
        console.log("Player is ready");

        jQuery.ajax({
            url: post_data.ajax_url,
            type: 'POST',
            data: {
                action: 'fetch_vtt_url',
                post_id: post_data.post_id,
                security: post_data.security
            },
            success: function(response) {
                if (response.success) {
                    var vttFileUrl = response.vtt_file_url;
                    if (vttFileUrl) {
                        captionContainer = document.createElement('div');
                        captionContainer.className = 'caption';
                        document.querySelector('.plyr__video-embed').appendChild(captionContainer);

                        fetch(vttFileUrl)
                            .then(response => response.text())
                            .then(data => parseVTT(data))
                            .catch(error => {
                                console.error("Error fetching VTT file:", error);
                            });
                    } else {
                        console.error("No VTT file URL found in response");
                    }
                } else {
                    console.error("Response indicates failure", response);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error("AJAX request failed", textStatus, errorThrown);
            }
        });
    }

    function onPlayerStateChange(event) {
        if (event.data == YT.PlayerState.PLAYING) {
            interval = setInterval(function() {
                var currentTime = roundTime(player.getCurrentTime());
                displayCaption(currentTime);
            }, 500);
        } else {
            clearInterval(interval);
        }
    }

    function parseVTT(data) {
        var lines = data.split('\n');
        var caption = {};
        var currentStartTime;

        lines.forEach(line => {
            if (line.includes('-->')) {
                var times = line.split(' --> ');
                currentStartTime = roundTime(parseTime(times[0]));
                caption.start = currentStartTime;
                caption.end = roundTime(parseTime(times[1]));
            } else if (line.trim() === '') {
                if (currentStartTime !== undefined) {
                    captions[currentStartTime] = caption;
                }
                caption = {};
            } else {
                caption.text = (caption.text ? caption.text + '\n' : '') + line;
            }
        });

        console.log("Captions parsed and stored");
    }

    function displayCaption(currentTime) {
        if (captions[currentTime]) {
            captionContainer.innerText = captions[currentTime].text;
            console.log("Displaying caption:", captions[currentTime].text);
        } else {
            captionContainer.innerText = '';
            console.log("No caption to display at current time:", currentTime);
        }
    }

    function parseTime(time) {
        var parts = time.split(':');
        var seconds = parts.pop();
        var minutes = parts.pop();
        var hours = parts.length ? parts.pop() : 0;
        return parseFloat(hours) * 3600 + parseFloat(minutes) * 60 + parseFloat(seconds);
    }

    function roundTime(time) {
        return Math.round(time);
    }
}
//======================================================
window.onload = function() {
    console.log("Window loaded");

    var player = document.querySelector('.plyr__video-embed');
    if (player) {
        // console.log("Player found");

        jQuery.ajax({
            url: post_data.ajax_url,
            type: 'POST',
            data: {
                action: 'fetch_vtt_url',
                post_id: post_data.post_id,
                security: post_data.security
            },
            success: function(response) {
                // console.log("AJAX request successful", response);

                if (response.success) {
                    var vttFileUrl = response.vtt_file_url;
                    if (vttFileUrl) {
                        // console.log("VTT file URL found:", vttFileUrl);

                        var captionContainer = document.createElement('div');
                        captionContainer.className = 'caption';
                        player.appendChild(captionContainer);
                        // console.log("Caption container appended to player");

                        fetch(vttFileUrl)
                            .then(response => {
                                // console.log("VTT file fetch successful");
                                return response.text();
                            })
                            .then(data => {
                                // console.log("VTT file data received");
                                parseVTT(data);
                            })
                            .catch(error => {
                                console.error("Error fetching VTT file:", error);
                            });

                        function parseVTT(data) {
                            // console.log("Parsing VTT data");
                            var captions = {};
                            var lines = data.split('\n');
                            var caption = {};
                            var currentStartTime;

                            lines.forEach(line => {
                                if (line.includes('-->')) {
                                    var times = line.split(' --> ');
                                    currentStartTime = roundTime(parseTime(times[0]));
                                    caption.start = currentStartTime;
                                    caption.end = roundTime(parseTime(times[1]));
                                    // console.log("Parsed caption times:", caption.start, caption.end);
                                } else if (line.trim() === '') {
                                    if (currentStartTime !== undefined) {
                                        captions[currentStartTime] = caption;
                                        // console.log("Caption added:", caption);
                                    }
                                    caption = {};
                                } else {
                                    caption.text = (caption.text ? caption.text + '\n' : '') + line;
                                    // console.log("Caption text updated:", caption.text);
                                }
                            });

                            function displayCaption() {
                                var currentTime = roundTime(player.currentTime);
                                console.log(player);
                                if (captions[currentTime]) {
                                    captionContainer.innerText = captions[currentTime].text;
                                    console.log("Displaying caption:", captions[currentTime].text);
                                } else {
                                    captionContainer.innerText = '';
                                    console.log("No caption to display at current time:", currentTime);
                                }
                            }

                            setInterval(displayCaption, 500);
                            console.log("Caption display interval set");
                        }

                        function parseTime(time) {
                            // console.log("Parsing time:", time);
                            var parts = time.split(':');
                            var seconds = parts.pop();
                            var minutes = parts.pop();
                            var hours = parts.length ? parts.pop() : 0;
                            var parsedTime = parseFloat(hours) * 3600 + parseFloat(minutes) * 60 + parseFloat(seconds);
                            // console.log("Parsed time:", parsedTime);
                            return parsedTime;
                        }

                        function roundTime(time) {
                            // Round to the nearest second
                            return Math.round(time);
                        }
                    } else {
                        console.error("No VTT file URL found in response");
                    }
                } else {
                    console.error("Response indicates failure", response);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error("AJAX request failed", textStatus, errorThrown);
            }
        });
    } else {
        console.error("Player not found");
    }
};


//========================================

document.addEventListener('DOMContentLoaded', function() {
    // Wait for the video player to load
    const checkVideoPlayerLoaded = setInterval(() => {
        const player = document.querySelector('.plyr__video-embed');
        if (player) {
            clearInterval(checkVideoPlayerLoaded);

            // Add caption container
            const captionContainer = document.createElement('div');
            captionContainer.className = 'caption';
            player.appendChild(captionContainer);

            const vttFileUrl = player.getAttribute('data-vtt-file');
            let captions = [];
            let currentCaptionIndex = 0;

            fetch(vttFileUrl)
                .then(response => response.text())
                .then(data => parseVTT(data));

            function parseVTT(data) {
                const lines = data.split('\n');
                let caption = {};
                lines.forEach(line => {
                    if (line.includes('-->')) {
                        const times = line.split(' --> ');
                        caption.start = parseTime(times[0]);
                        caption.end = parseTime(times[1]);
                    } else if (line.trim() === '') {
                        captions.push(caption);
                        caption = {};
                    } else {
                        caption.text = (caption.text ? caption.text + '\n' : '') + line;
                    }
                });
            }

            function parseTime(time) {
                const parts = time.split(':');
                const seconds = parts.pop();
                const minutes = parts.pop();
                const hours = parts.length ? parts.pop() : 0;
                return parseFloat(hours) * 3600 + parseFloat(minutes) * 60 + parseFloat(seconds);
            }

            function displayCaption() {
                const currentTime = player.currentTime;
                if (captions[currentCaptionIndex] && currentTime >= captions[currentCaptionIndex].start && currentTime <= captions[currentCaptionIndex].end) {
                    captionContainer.innerText = captions[currentCaptionIndex].text;
                } else {
                    captionContainer.innerText = '';
                    currentCaptionIndex++;
                }
            }

            setInterval(displayCaption, 500);
        }
    }, 100);
});
