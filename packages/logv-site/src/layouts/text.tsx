import React from 'react'

import { Layout, MaxWidth } from '../components/layout'
import { Seo } from '../components/seo'

export const TextLayout: React.SFC<{}> = ({ children }) => (
	<Layout>
		<Seo title="" />
		<MaxWidth>{children}</MaxWidth>
	</Layout>
)
