module.exports = {
	siteMetadata: {
		title: `logv`,
		description: `LogV structured log viewer`,
		author: `Stanislav Panferov`,
	},
	plugins: [
		{
			resolve: `gatsby-plugin-typescript`,
			options: {
				isTSX: true,
				allExtensions: true,
			},
		},
		`gatsby-plugin-linaria`,
		'gatsby-plugin-antd',
		`gatsby-plugin-react-helmet`,
		{
			resolve: `gatsby-source-filesystem`,
			options: {
				name: `images`,
				path: `${__dirname}/src/images`,
			},
		},
		`gatsby-transformer-sharp`,
		`gatsby-plugin-sharp`,
		{
			resolve: `gatsby-plugin-google-analytics`,
			options: {
				trackingId: 'UA-148715943-1',
			},
		},
	],
}
