import React from 'react'
import Helmet from 'react-helmet'
import { graphql, StaticQuery } from 'gatsby'

export interface SeoProps {
	description?: string
	lang?: string
	meta?: {
		name: string
		content: string
	}[]
	title: string
}

const query = graphql`
	query {
		site {
			siteMetadata {
				title
				description
				author
			}
		}
	}
`

export class Seo extends React.Component<SeoProps> {
	render() {
		const { description, lang, meta, title } = this.props

		return (
			<StaticQuery query={query}>
				{data => {
					const { site } = data
					const metaDescription = description || site.siteMetadata.description
					return (
						<Helmet
							htmlAttributes={{
								lang,
							}}
							title={title}
							titleTemplate={`%s | ${site.siteMetadata.title}`}
							meta={[
								{
									name: `description`,
									content: metaDescription,
								},
								{
									property: `og:title`,
									content: title,
								},
								{
									property: `og:description`,
									content: metaDescription,
								},
								{
									property: `og:type`,
									content: `website`,
								},
								{
									name: `twitter:card`,
									content: `summary`,
								},
								{
									name: `twitter:creator`,
									content: site.siteMetadata.author,
								},
								{
									name: `twitter:title`,
									content: title,
								},
								{
									name: `twitter:description`,
									content: metaDescription,
								},
							].concat(meta || [])}
						/>
					)
				}}
			</StaticQuery>
		)
	}
}
