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
                        captionContainer.className = 'caption subtitle';
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

        // Inject toggle captions button
        var menu = document.querySelector('div[role="menu"]');
        if (menu) {
            var toggleButton = document.createElement('button');
            toggleButton.innerText = "Toggle Captions";
            toggleButton.className = "toggle-captions-button";
            toggleButton.type = "button";

            var captionsVisible = true; // Default to captions being visible
            toggleButton.addEventListener('click', function() {
                captionsVisible = !captionsVisible;

                var captionContainer = document.querySelector('div.caption.subtitle');
                
                captionContainer.style.display = captionsVisible ? 'block' : 'none';
                console.log("Captions " + (captionsVisible ? "shown" : "hidden"));
            });

            menu.appendChild(toggleButton);
            console.log("Toggle captions button appended to menu");
        } else {
            console.error("Menu not found");
        }
    } else {
        console.error("Player not found");
    }
};
