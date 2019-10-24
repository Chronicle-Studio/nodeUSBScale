<html>
<head>
<style>
    #scale {
        text-align: center;
        font-size: 4em;
        font-family: Helvetica, Arial, SansSerif;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
    }
    #scaleStatus {
        opacity: 0.5;
    }
    #scaleWeight {
        font-weight: 600;
    }
    #scaleUnit{
        text-transform: uppercase;
    }
</style>
</head>
<body>


<div id="scale">
    <span id="scaleStatus"></span>
    <span id="scaleWeight"></span>
    <span id="scaleUnit"></span>
</div>

<script>
    const connection = new WebSocket('ws://127.0.0.1:8789');
    connection.onopen = function() {
        document.getElementById('scaleStatus').innerHTML = 'connecting';
    };
    connection.onclose = function() {
        document.getElementById('scaleStatus').innerHTML = 'disconnected';
    };
    connection.onmessage = function(e) {
        var scale = JSON.parse(e.data);
        document.getElementById('scaleStatus').innerHTML = scale.status;
        document.getElementById('scaleWeight').innerHTML = scale.weight;
        document.getElementById('scaleUnit').innerHTML = scale.unit;
    };
    connection.onerror = function(error) {
        console.log('WebSocket error:', error);
        document.getElementById('scaleStatus').innerHTML = 'error';
    };
</script>

</body>
</html>