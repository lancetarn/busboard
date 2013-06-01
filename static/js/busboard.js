var BusBoard = {
	base_url : 'http://svc.metrotransit.org/NexTrip',
	get_routes  :  function( ) {
		if ( BusBoard.routes ) {
			return BusBoard.routes;
		}
		else {
			var url = this.base_url + '/Routes';
			route_response = $.ajax( url, { 
				type : 'GET',
				crossDomain : true,
				dataType : 'jsonp'
				} );
			console.log( route_response );
			return route_response.content;
		
		}
	},

	hotStop : function ( hotstop ) {
		
			this.stop       =  hotstop.stop;
			this.route      =  hotstop.route;
			this.direction  =  hotstop.direction;
			this.base_url   =  
			
			this.request_departures  =  function( ) {
				var url = this.base_url +
					'/' + this.route +
					'/' + this.direction +
					'/' + this.stop;

				$.get( url, this.add_departure_info );
				};

		},


    loading_decorator : function(el, decoration) {

		this.init = function (el, decoration) {
			this.loading = true;
			this.decoration = decoration;
			this.el      = el;
			console.log( el );
			console.log( this.el.text() );


			this.decorate_load();
			el.on('click', this.end_decoration );
		};

        // Add the characters in decoration
        // one at a time, 1/10th of a second apart
        // Reset at the end of the decoration string
        this.decorate_load  = function () {

            this.el.text( this.decoration );

			var i = 0;
            
		//	this.repeat_decorator(i);
		};

        this.repeat_decorator = function (i) {
			var self = this;
			current_text = self.el.text();

				setTimeout( function() {
					self.el.text( current_text += self.decoration[i] );
					i++;
					if ( ! self.loading ) {
						return;
					}
					else if ( i < self.decoration.length ) {
						self.repeat_decorator(i);
					}
					else {
						i = 0;
						console.log('Looped!');
						return;
//						self.repeat_decorator(i);
					}
				}, 100 ); 
			};
		

		this.end_decoration = function() {
			console.log("Set to false!");
			this.loading = false;
		};

		this.init( el, decoration );

	}
};
load_els = $('span.loader');
BusBoard.loading_decorator(load_els, 'Loading...');
