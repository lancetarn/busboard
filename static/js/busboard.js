var BusBoard = {
	base_url : 'http://svc.metrotransit.org/NexTrip',
    directions : [
      {value : 1, text : 'Southbound'},
      {value : 2, text : 'Eastbound'},
      {value : 3, text : 'Westbound'},
      {value : 4, text : 'Northbound'}
    ],	

    routes : {},
    hotstops : [],

    init : function ( ) {
        self = this;
        self.routes = self.get_routes( );
        self.hotstops = self.get_hotstops( );

        $('.new_hs').on('click', self.new_hotstop);
        },

    get_routes  :  function( ) {
        if ( ! $.isEmptyObject( self.routes ) ) {
			return self.routes;
		}
		else {
			var url = '/routes';
			$.get( url, function( response ) {
                self.routes = response;
                } );
        }
	},

    get_hotstops : function( ) {
        if ( self.hotstops ) {
            return self.hotstops;
        }
        else {
            hs_el = $( 'hotstops' );
            hs_el.fadeOut();
            var url = '/hotstops/json/';
            hotstops_response = $.ajax( url, {
                type : 'GET',
                dataType : 'json',
                success : function ( data ) {
                    this.hotstops = data;
                    hs_el.html( this.render( 'hs_base.html', data ) )
                        .fadeIn();
                }
            } );
        }
    },

	
	new_hotstop : function( ) {
		self.hotstops.push( new self.hotStop( ) );
	},


	hotStop : function ( hotstop_json ) {
		
			hotstop_json = hotstop_json || {};
			
            var self = this;

			self.init  =  function ( hotstop_json ) {
				
				self.id         =  hotstop_json.id || '';
				self.stop       =  hotstop_json.stop || {};
				self.route      =  hotstop_json.route || {};
				self.direction  =  hotstop_json.direction || {};
				//self.available_directions = self.get_available_directions();
				self.render( );
			};


            // Set up listeners
            self.add_route_listeners  =  function ( form ) {
				form
					.on( 'change','.route_select', self.handle_update_route );
					//.on ( 'change', 'direction_select', self.handle_update_stops );
			};
			
			self.request_departures  =  function( ) {
				var url = BusBoard.base_url +
					'/' + self.route +
					'/' + self.direction +
					'/' + self.stop;

				$.get( url, self.update_departure_info );
            };
            
            self.get_stops = function( ) {
                var url = '/stops/' +
                    self.route.id + '/' +
                    self.direction.id; 
                $.get( url, function( j_stops ) {
                    self.stops = j_stops;
                } );

            };

            self.get_available_directions = function( ) {
                var url = '/directions/' + self.route.id;
                return $.get( url, function( data ) {
                    self.available_directions = data;
					console.log( self.available_directions );
                } );
            };

            self.route_selected  =  function ( e ) {
                console.log( e.currentTarget );
                 self.route = $(e.currentTarget).val();
            };
			self.handle_update_route = function ( e ) {
				self.route.id  =  e.currentTarget.value;
				var dfd = self.get_available_directions( );
				dfd.then( self.update_form_directions );
			};

			self.update_form_directions = function ( ) {
				var direction_select  =  self.hs_el.find( 'select.direction_select');
				var source;
				var response = $.get( '/static/js_temps/hs_directions.html' ); 
				response.then ( function ( html ) {
					source = html;
					var template = Handlebars.compile( source );
					direction_select.html(template(self.available_directions));
				} );
			};

            self.handle_update_stops = function ( ) {
				console.log( 'calling' );
                // Get the stops
                // Get the form select element
                var el = $('#stop_select_test');
				el_stops = render( 'hs_stops', self );
				el.html( el_stops );
                // Compile the new selector 
                // Update the form element
            };

			self.render  =  function ( ) {
				if ( self.id ) {
				// Put yourself into the base template.
				}
				// Render a new form
				else {
					var data = { routes : BusBoard.routes, 
						directions : BusBoard.directions,
						id : 'new'
					};
					var source;
					var response = $.get( '/static/js_temps/hs_form.html' ); 
					response.then ( function ( html ) {
						source = html;
						var template = Handlebars.compile( source );
						$('#hotstops').prepend(template(data));
						self.add_route_listeners( $('form.hotstop_form') );
						self.hs_el = hotstop_json.el || $('form.hotstop_form.new_hs');
					} );
				}
			};

            self.insert_hotspot = function ( ) {};
            self.save_hotspot = function ( hotspot_id ) {};
			
			self.init( hotstop_json );
    },


    render : function (tmpl_name, tmpl_data) {
        var render = render || {};
        if ( !render.tmpl_cache ) { 
            render.tmpl_cache = {};
        }

        if ( ! render.tmpl_cache[tmpl_name] ) {
            var tmpl_dir = '/static/js_temps/';
            var tmpl_url = tmpl_dir + tmpl_name + '.html';

            var tmpl_string;
            $.ajax({
                url: tmpl_url,
                method: 'GET',
                async: false,
                success: function(data) {
                    tmpl_string = data;
                }
            });

            render.tmpl_cache[tmpl_name] = Handlebars.compile(tmpl_string);
        }

        return render.tmpl_cache[tmpl_name](tmpl_data);
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
BusBoard.init( );
