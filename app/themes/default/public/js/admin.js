define([
    'jquery', 'alertify', 'collapse', 'collapse_storage', 'customselect'
], function($, alertify){

	var loadCollapse = function() {
		$("#admin.collapse").collapse({
			open: function() {
				this.slideDown(100);
			},
			close: function() {
				this.slideUp(100);
			},
			accordion : true,
			persist : true
		});
	}

	var to;

	$('select').customSelect({
		loaded : function() {
			if(to !== undefined)
				clearTimeout(to);

			to = setTimeout(function() {
					loadCollapse();
				}, 10);
		}
	});

	$('#change-theme input[type="submit"]').on('click', function(evt) {
		evt.preventDefault();

        alertify.confirm("Pas encore tout à fais au point, si vous avez une erreur 502 ou que ça charge dans le vide c'est normal, actualisez :)", function (e) {
            if (e) {
                return $('#change-theme').submit();
            } else {
                return false;
            }
        });


	});

	$('a[href="#more"]').click(function() {
		$(this).closest('li').find('.user-more').slideToggle();
	});

});
