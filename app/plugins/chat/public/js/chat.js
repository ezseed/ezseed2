define([
    'jquery', 'desktop', 'text!../../plugins/chat/public/views/message.ejs'
], function($, Desktop, Chat){

var ago = function(time, local){
 
	(!local) && (local = Date.now());
 

	if(typeof time == 'string')
		time = new Date(time).getTime();
	
	var
		offset = Math.abs((local - time)/1000),
		span   = [],
		MINUTE = 60,
		HOUR   = 3600,
		DAY    = 86400,
		WEEK   = 604800,
		MONTH  = 2629744,
		YEAR   = 31556926;
		DECADE = 315569260;
 
	if (offset <= MINUTE)              span = [ '', 'à l\'instant' ];
	else if (offset < (MINUTE * 60))   span = [ Math.round(Math.abs(offset / MINUTE)), 'min' ];
	else if (offset < (HOUR * 24))     span = [ Math.round(Math.abs(offset / HOUR)), 'h' ];
	else if (offset < (DAY * 7))       span = [ Math.round(Math.abs(offset / DAY)), 'jr' ];
	else if (offset < (WEEK * 52))     span = [ Math.round(Math.abs(offset / WEEK)), 'semaine' ];
	else if (offset < (YEAR * 10))     span = [ Math.round(Math.abs(offset / YEAR)), 'année' ];
	else if (offset < (DECADE * 100))  span = [ Math.round(Math.abs(offset / DECADE)), 'decade' ];
	else                               span = [ '', 'il y a longtemps' ];
 
	span[1] += (span[0] === 0 || span[0] > 1) ? 's' : '';
	span = span.join(' ');
 
	return (time <= local)  ? 'il y a '+ span : 'dans ' + span;
};

	if(user) {
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
			
			$msgs.prepend(
				_.template(Chat, {messages : messages, ago: ago})
			);


			$msgs.scrollTop($msgs[0].scrollHeight);

		});

		socket.on('chat:message', function(m) {
			var last = $msgs.find('li:last .pseudo').attr('data-user'), $last = $msgs.find('li:last');

			if(last == m.user)
				$last.append(m.message);
			else
				$msgs.append('<li><span class="pseudo" data-user="'+m.user + ' - '+ ago(m.time) +'">'+m.user + '</span>' + m.message +'</li>');

			$msgs.scrollTop($msgs[0].scrollHeight);

		})

		socket.on('chat:joined', function(users) {
			var nb = users.length, users = users.join(', ');

			if(nb < 4)
				$('#chat .users').text(users);
			else
				$('#chat .users').html('<span title="'+users+'">'+ nb + ' utilisateurs');
		});
	}

})