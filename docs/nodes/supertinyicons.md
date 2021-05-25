# Super Tiny Icons

Node classes list of [Super Tiny Icons](https://github.com/edent/SuperTinyIcons) provider.

<script>listResources("supertinyicons");</script>

```js
ctx.attributes.graphviz.engine = 'fdp'

var providerName = 'supertinyicons'

Diagram(providerName, () => {
	Cluster(providerName, () => {
		var provider = diagrams[providerName]
		for (var resourceGroupName in provider) {
			Cluster(providerName + '.' + resourceGroupName, () => {
				var resources = provider[resourceGroupName]
				for (var resourceName in resources) {
					ctx[providerName + '_' + resourceGroupName + '_' + resourceName] = resources[resourceName](resourceName)
				}
			})
			
		}
	})
})
```
