require([
    'jquery', 'desktop'
], function($, Desktop){

	var socket = Desktop.socket;
	var $msgs = $('#chat .messages');

	$('#chat').on('keydown', '#textarea', function(e) {
		if(e.keyCode == 13 && !e.shiftKey) {
			e.preventDefault();
			socket.emit('chat:message',user.username, $(this).text());
			$(this).empty();
		}
	});

	socket.on('connect', function () {
		socket.emit('chat:join',  user.username );
	});

	/*Receive messages for the first time*/
	socket.on('chat:init', function(messages) {
		var n = messages.length;

		while(n--) {
			m = messages[n];
			$msgs.append('<li><span class="pseudo" data-user="'+m.user+'">'+m.user + '</span>' + m.message +'</li>');
		}
		$msgs.scrollTop($msgs[0].scrollHeight);

	});

	socket.on('chat:message', function(m) {
		var last = $msgs.find('li:last .pseudo').attr('data-user'), $last = $msgs.find('li:last');

		if(last == m.user)
			$last.append(m.message);
		else
			$msgs.append('<li><span class="pseudo" data-user="'+m.user+'">'+m.user + '</span>' + m.message +'</li>');

		$msgs.scrollTop($msgs[0].scrollHeight);

	})

	socket.on('chat:joined', function(user) {
		$msgs.append('<li><i>' + user + ' s\'est connecté</i></li>');
	});

})