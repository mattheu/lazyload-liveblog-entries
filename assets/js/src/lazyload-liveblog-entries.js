(function($) {

	LazyloadLiveblogEntries = function() {

		var self = this;

		self.$el        = $('#liveblog-entries');
		self.$indicator = $('<div id="liveblog-lazyload-spinner"></div>');
		self.$spinner   = $('<div class="spinner" style="position:relative; margin: 1em auto;"></div>');
		self.options    = {};
		self.entries    = [];

		/**
		 * Initialize lazyloader with options passed from wp_enqueue_script.
		 *
		 */
		self.init = function( options ) {
			self.$el.after( self.$indicator );
			self.options = options;
			self.postsPerPage = parseInt( options.posts_per_page, 10 );
			self.requestAnimationFrame( self.loadMore );
		};

		/**
		 * Load another batch of posts and append them to the liveblog-entries
		 * element.
		 *
		 */
		self.loadMore = function() {

			self.loading(true);

			$.get( self.ajaxRequestUrl(), {},
				function(response) {

					self.loading(false);

					/*
					 * Since the response will be ascending order,
					 * reverse it before processing it.
					 */
					self.entries = response.entries.reverse();

					self.renderEntriesPage();
				}
			);
		};
	

		/**
		 * Shim for requestAnimationFrame
		 *
		 */
		self.requestAnimationFrame = function(){
			 return ( window.requestAnimationFrame || function(/* function */ fn){ window.setTimeout(fn); } );
		 }();

		/**
		 * Show spinner indicator when loading more entries.
		 *
		 */
		self.loading = function( isLoading ) {
			if ( isLoading ) {
				self.$spinner.appendTo( self.$indicator );
			} else {
				self.$spinner.detach();
			}
		};


		/**
		 * Render another "page" of entries.
		 *
		 * Takes another batch of entries from self.entries and appends them to
		 * the liveblog content element.
		 */
		self.renderEntriesPage = function() {

			self.loading(true);

			var entries = self.entries.slice( 0, self.postsPerPage );
			self.entries = self.entries.slice( self.postsPerPage );

			$.each( entries, function( i, entry ) {

				var $e = $( entry.html ).appendTo( self.$el ),
					timestamp = $e.data('timestamp');

				if ( timestamp < self.options.earliest_timestamp ) {
					self.options.earliest_timestamp = timestamp;
				}
			});

			self.updateTimes();
			self.loading(false);

			if ( self.entries.length ) {
				self.requestAnimationFrame( self.renderEntriesPage );
			}
		};


		/**
		 * Update the timestamps on newly inserted entries.
		 *
		 * Liveblog plugin only updates timestamps once a minute. This looks
		 * awkward on archived livblogs, where for example all of the entries
		 * should have human time diffed timestamps, but the newly inserted
		 * ones just have `3:21pm` - type stamps.
		 */
		self.updateTimes = function() {
			if ( typeof liveblog != 'undefined' && 
					typeof liveblog.entriesContainer != 'undefined' && 
					typeof liveblog.entriesContainer.updateTimes != 'undefined' ) {
				liveblog.entriesContainer.updateTimes();
			}
		};


		/**
		 * Build the URL to get more posts through Ajax.
		 *
		 * Uses the liveblog plugin's endpoint structure:
		 * '{permalink}/liveblog/{from_timestamp}/{to_timestamp}/'
         *
		 */
		self.ajaxRequestUrl = function() {
			return [
				self.options.permalink,              // Post permalink
				self.options.liveblog_endpoint,      // 'liveblog' slug
				'/',
				'0',                                 // from_timestamp: Go all the back
				'/',
				self.options.earliest_timestamp - 1, // to_timestamp: Earliest entry already fetched.
				'/'
			].join('');
		};


		/**
		 * Start the plugin.
		 *
		 */
		if ( typeof liveblogInit !== 'undefined' ) {
			self.init( liveblogInit );
		}

		return self;
	}();

})(jQuery);


