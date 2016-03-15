(function() {

    'use strict';

    document.addEventListener('touchmove', function(e) {
        e.preventDefault();
    });

    var host = window.location.hostname;

    var ws = null;
    var wswatch = null;

    var allSlider = [];

    function messageHandler(d) {
        var packet = JSON.parse(d.data);

        for (var i = 0; i < packet.data.length; i++) {
            var slider = allSlider[i + 1];
            if (slider) {
                slider.setValue(packet.data[i]);
            }
        }

    }

    var connectWebsockets = function() {
        if (ws != null) {
            ws.close();
        }

        if (wswatch) {
            clearTimeout(wswatch);
            wswatch = null;
        }

        ws = new WebSocket('ws://' + host + ':8081');

        ws.onerror = ws.onclose = function() {

            if (!wswatch) {
                console.log('error. try again')
                wswatch = setTimeout(function() {
                    connectWebsockets();
                    wswatch = null;
                }, 5000)
            }
        };

        ws.onmessage = messageHandler;
    }

    connectWebsockets();

    var makeSlider = function() {

        var wrapper = document.createElement('div');
        wrapper.className = 'slider';

        var slider = document.createElement('input');
        slider.type = 'range'
        slider.value = 0;
        slider.min = 0;
        slider.max = 255;

        var label = document.createElement('div');
        label.className = 'label';
        label.textContent = 0;

        wrapper._input = slider;
        wrapper._label = label;
        slider._label = label;
        slider._wrap = wrapper;

        wrapper.appendChild(slider);
        wrapper.appendChild(label);

        var pulse = document.createElement('div');
        pulse.className = 'pulse';
        pulse._slider = slider;
        pulse._wrapper = wrapper;

        wrapper._pulse = pulse;
        pulse.addEventListener('mousedown', function() {
            this._pulseback = this._slider.value;
            this._wrapper.setValue(255,true);
        });
        pulse.addEventListener('mouseup', function() {
            this._wrapper.setValue(this._pulseback,true);
        });

        wrapper.setValue = function(value,send) {

            this._input.value = value;
            slider._label.textContent = value;

            if( send ){
                ws.send(this._ch + "=" + value);
            }
        }


        wrapper.appendChild(pulse);

        slider.addEventListener('input', function() {
            this._label.textContent = this.value;
            ws.send(this._wrap._ch + "=" + this.value);
        });

        return wrapper;
    }

    var wrapper = document.createElement('div');
    wrapper.className = "controls";

    for (var i = 1; i <= 512; i++) {
        var slider = makeSlider();
        slider._ch = i;
        slider._val = 0;
        slider._pulse.textContent = i;
        allSlider[i] = slider;
        wrapper.appendChild(slider);
    }

    document.body.appendChild(wrapper);


})()
