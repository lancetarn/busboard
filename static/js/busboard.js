var BusBoard = {

	base_url : 'http://svc.metrotransit.org/NexTrip',
    routes : {},
    hotstops : [],

    init : function ( ) {
        self = this;
        self.routes = self.get_routes( );
        self.hotstops = self.get_hotstops( );
		self.hs_el = $( '#hotstops' );
		console.log( self.hs_el);
		
		$.get( '/static/js_temps/hs_base.hbs', function ( html ) {
			self.hs_template = Handlebars.compile(html);
		});

        $( document ).on('click', '.new_hs', self.new_hotstop);
		$( document ).on('hs_saved', self.redraw_hotstops);
		

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
        if ( self.hotstops.length ) {
            return self.hotstops;
        }
        else {
            var url = '/hotstops/';
            hotstops_response = $.ajax( url, {
                type : 'GET',
                dataType : 'json',
                success : self.set_hotstops
			});
        }
    },

	redraw_hotstops : function( e ) {
		console.log( 'Redrawing');
		self.hs_el.fadeOut( function () {
			self.hs_el.html( self.hs_template(self.hotstops) ).fadeIn();
			$( '.new_hs' ).fadeIn();
			
		} );
	},
		

	
	new_hotstop : function( ) {
		$( this ).fadeOut( );
		var new_hs = new self.hotStop( );
		self.hotstops.push( new_hs );
		new_hs.render();
	},

	set_hotstops : function( data ) {
		var pending_hotstops = [];
		$.each( data.hotstops, function( index, hotstop ) {
			pending_hotstops.push( new self.hotStop( hotstop ) );
		} );
		self.hotstops = pending_hotstops;
	},


	hotStop : function ( hotstop_json ) {
		
            var self = this;


			self.init  =  function ( hotstop_json ) {
				
				self.hotstop_json = hotstop_json || {};
				
				self.id         =  hotstop_json.id || 'new_hs';
				self.stop       =  hotstop_json.stop || {};
				self.route      =  hotstop_json.route || {};
				self.direction  =  hotstop_json.direction || {};
				self.available_routes  =  BusBoard.get_routes( );

				if ( self.route.length ) {
					self.available_directions = self.get_available_directions();
				
					if ( self.direction.length ) {
						self.get_available_stops = {};
					}
				}
			};


            // Set up listeners
            self.add_route_listeners  =  function ( form ) {
				form
					.on( 'change','.route_select', self.handle_route_change )
					.on ( 'change', '.direction_select', self.handle_direction_change );
			};

			self.add_submit_listener = function ( form ) {
				form.on( 'click', 'button.add_hs', self.save_hotstop );
			};
			
			self.request_departures  =  function( ) {
				var url = BusBoard.base_url +
					'/' + self.route +
					'/' + self.direction +
					'/' + self.stop;

				$.get( url, self.update_departure_info );
            };
            
            self.get_available_stops = function( ) {
                var url = '/stops/' +
                    self.route.id + '/' +
                    self.direction.id; 
                return $.get( url, function( j_stops ) {
                    self.available_stops = j_stops;
                } );

            };

            self.get_available_directions = function( ) {
                var url = '/directions/' + self.route.id;
                return $.get( url, function( data ) {
                    self.available_directions = data;
                } );
            };

			self.handle_route_change = function ( e ) {
				self.route.id  =  e.currentTarget.value;
				var dfd = self.get_available_directions( );
				dfd.then( self.update_form_directions );
			};

			self.update_form_directions = function ( ) {
				var direction_select  =  self.hs_form_el.find( 'select.direction_select');
				var source;
				var response = $.get( '/static/js_temps/hs_directions.hbs' ); 
				response.then ( function ( html ) {
					source = html;
					var template = Handlebars.compile( source );
					direction_select.html(template(self));
				} );
			};

            self.handle_direction_change = function ( e ) {
				self.direction.id  = e.currentTarget.value;
				dfd = self.get_available_stops( );
				dfd.then( self.update_form_stops );
			};

			self.update_form_stops  =  function( ) {
				var stop_select  =  self.hs_form_el.find( 'select.stop_select' );
				var response = $.get( '/static/js_temps/hs_stops.hbs' );
				response.then( function( html ) {
					var template = Handlebars.compile( html );
					stop_select.html( template( self ) );
				} );
			};


			self.render  =  function ( ) {
				if ( self.id !== 'new_hs' ) {
				// Put yourself into the base template.
				}
				// Render a new form
				else { 
					dfds  = self.get_form_partials( );
					$.when( dfds ).done( self.render_new_form );
				}
			};

			self.render_new_form = function ( ) {
					var source;
					var response = $.get( '/static/js_temps/hs_form.hbs' ); 

					response.then( function ( html ) {
						source = html;
						var template = Handlebars.compile( source );
						self.register_form_partials( );
						$('#hotstops').prepend(template( self )).hide().fadeIn();
						self.hs_form_el = $('#new_hs');
						self.add_route_listeners( self.hs_form_el );
						self.add_submit_listener( self.hs_form_el );
					} );
				};

			self.get_form_partials = function ( ) {
				var dfds = [];
				var route_dfd = $.get( '/static/js_temps/hs_routes.hbs', function( html ) {
					self.route_partial  =  Handlebars.compile( html );
				} );
				var direction_dfd = $.get( '/static/js_temps/hs_directions.hbs', function( html ) {
					self.direction_partial = Handlebars.compile( html );
				} );
				var stop_dfd = $.get( '/static/js_temps/hs_stops.hbs', function( html ) {
					self.stop_partial = Handlebars.compile( html );
				} );
				dfds.push( route_dfd, direction_dfd, stop_dfd );
				return dfds;
			};

			self.register_form_partials = function( ) {
				Handlebars.registerPartial( "route_selector", self.route_partial );
				Handlebars.registerPartial( "direction_selector", self.direction_partial );
				Handlebars.registerPartial( "stop_selector", self.stop_partial );
			};

            self.save_hotstop = function ( e ) {
				e.preventDefault( );
				self.hs_form_el.fadeOut().remove();
				saved = $.post( '/hotstops/', self.hs_form_el.serialize() );
				saved.then( function( data ) {
					BusBoard.set_hotstops( data );
					console.log( BusBoard.hotstops);
					$( document ).trigger( 'hs_saved' );
				} );


				};


			self.delete_hotstop = function( e ) {
				e.preventDefault( );
				var settings = {
					'data' : { 'id' : self.id },
					'type' : 'DELETE'};
				deleted = $.ajax('/hotstops/', settings);
				deleted.then( function () {
					self.hs_el.slideUp( function( ) {
						self.hs_el.remove();
					});
				});
			};

			
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

