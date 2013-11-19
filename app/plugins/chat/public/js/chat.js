define([
    'jquery', 'desktop', 'text!/views/message.ejs'
], function($, Desktop, Chat){

	var socket = Desktop.socket;
	var $msgs = $('#chat .messages');

	$('#chat').on('keydown', '#textarea', function(e) {
		if(e.keyCode == 13 && !e.shiftKey) {
			e.preventDefault();
			socket.emit('chat:message',user.username, $(this).text());
			$(this).empty();
		}
	});

	$(document).ready(function() { 
		if(!$.cookie('chatclosed')) {
			$("#chat").css({height: '350px'}).toggleClass('closed');
			$('#chat i[class*="entypo"]').toggleClass('entypo-minus-squared').toggleClass('entypo-plus-squared');
		}
	})

	$('#chat .top').on('click', function() {
		var $chat = $('#chat');

		if($chat.hasClass('closed')) {
			$chat.animate({height: '350px'}).toggleClass('closed');
			$.cookie('chatclosed', false);
		} else {
			$chat.animate({height: '20px'}).toggleClass('closed');
			$.cookie('chatclosed', true);
		}

		$(this).find('i[class*="entypo"]').toggleClass('entypo-minus-squared').toggleClass('entypo-plus-squared');
	});

	socket.on('connect', function () {
		socket.emit('chat:join',  user.username );
	});

	/*Receive messages for the first time*/
	socket.on('chat:init', function(messages) {

		//console.log(_.template(Chat, {messages : messages}));
		
		$msgs.prepend(
			_.template(Chat, {messages : messages})
		);


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

	socket.on('chat:joined', function(users) {
		var nb = users.length, users = users.join(', ');

		if(nb < 4)
			$('#chat .users').text(users);
		else
			$('#chat .users').html('<span title="'+users+'">'+ nb + ' utilisateurs');
	});

})