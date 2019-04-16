const { api, ArticlePage } = require( '../support/world' );
const Api = require( 'wdio-mediawiki/Api' );
const Page = require( 'wdio-mediawiki/Page' );
const {
	iAmOnPage,
	waitForPropagation,
	createPages,
	createPage
} = require( './common_steps' );

const iAmInAWikiThatHasCategories = ( title ) => {
	const msg = 'This page is used by Selenium to test category related features.',
		wikitext = `
            ${msg}

            [[Category:Test category]]
            [[Category:Selenium artifacts]]
            [[Category:Selenium hidden category]]
        `;

	createPages( [
		[ 'create', 'Category:Selenium artifacts', msg ],
		[ 'create', 'Category:Test category', msg ],
		[ 'create', 'Category:Selenium hidden category', '__HIDDENCAT__' ]
	] )
		.catch( ( err ) => {
			if ( err.code === 'articleexists' ) {
				return;
			}
			throw err;
		} );

	// A pause is necessary to let the categories register with database before trying to use
	// them in an article
	waitForPropagation( 5000 );
	Api.edit( title, wikitext );
	// categories are handled by a JobRunner so need extra time to appear via API calls!
	waitForPropagation( 5000 );
};

const iAmOnAPageThatHasTheFollowingEdits = function ( table ) {
	const randomString = Math.random().toString( 36 ).substring( 7 ),
		pageTitle = `Selenium_diff_test_${randomString}`,
		edits = table.rawTable.map( ( row, i ) =>
			[ i === 0 ? 'create' : 'edit', pageTitle, row[ 0 ] ] );

	api.loginGetEditToken( {
		username: browser.options.username,
		password: browser.options.password,
		apiUrl: `${browser.options.baseUrl}/api.php`
	} )
		.then( () => api.batch( edits ) )
		.then( () => ArticlePage.open( pageTitle ) )
		.catch( ( err ) => { throw err; } );
	waitForPropagation( 5000 );
};

const iGoToAPageThatHasLanguages = () => {
	const wikitext = `This page is used by Selenium to test language related features.

	[[es:Selenium language test page]]
`;

	return createPage( 'Selenium language test page', wikitext ).then( () => {
		iAmOnPage( 'Selenium language test page' );
	} );
};

const watch = ( title ) => {
	// Ideally this would use the API but mwbot / Selenium's API can't do this right now
	// So we run the non-js workflow.
	const page = new Page();
	page.openTitle( title, { action: 'watch' } );
	browser.element( '#mw-content-text button[type="submit"]' ).click();
	waitForPropagation( 10000 );
};

const iAmViewingAWatchedPage = () => {
	const title = `I am on the "Selenium mobile watched page test ${new Date().getTime()}`;

	createPage( title, 'watch test' ).then( () => {
		watch( title );
		// navigate away from page
		iAmOnPage( 'Main Page' );
		waitForPropagation( 5000 );
		// and back to page
		iAmOnPage( title );
		waitForPropagation( 5000 );
	} );
};

const iAmViewingAnUnwatchedPage = () => {
	// new pages are watchable but unwatched by default
	const title = 'I am on the "Selenium mobile unwatched test ' + new Date();
	iAmOnPage( title );
};

const iAmOnAPageWithNoTalkTopics = () => {
	const title = `Selenium talk test ${new Date()}`;

	createPage( title, 'Selenium' );
	iAmOnPage( title );
};

module.exports = {
	waitForPropagation,
	iAmOnAPageThatHasTheFollowingEdits,
	iAmOnAPageWithNoTalkTopics,
	iAmViewingAWatchedPage,
	iAmViewingAnUnwatchedPage,
	iAmInAWikiThatHasCategories,
	iGoToAPageThatHasLanguages
};