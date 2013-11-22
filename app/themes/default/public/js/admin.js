require.config({
    'baseUrl': '/javascripts',
    'paths':
    {
        //helpers
        async: 'helpers/async',
        underscore : 'helpers/underscore',
        //admin modules
        collapse : 'modules/jquery.collapse',
        collapse_storage : 'modules/jquery.collapse_storage',
        customselect: 'modules/customselect',
        admin : '../js/admin'
    },

    //SEE http://requirejs.org/docs/api.html#config-waitSeconds
    waitSeconds: 25
});

require([
    'jquery', 'collapse', 'collapse_storage', 'customselect'
], function($){

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

	$('#change-theme').on('submit', function() {

        alertify.confirm("Pas encore tout à fais au point, si vous avez une erreur 502 c'est normal, revenez à la page précédente :)", function (e) {
            if (e) {
                return true;
            } else {
                return false;
            }
        });


	});

	$('a[href="#more"]').click(function() {
		$(this).closest('li').find('.user-more').slideToggle();
	});

});
