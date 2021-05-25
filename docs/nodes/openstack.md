# OpenStack

Node classes list of [OpenStack](https://github.com/mingrammer/diagrams/tree/master/resources/openstack) provider.

<script>listResources("openstack");</script>

```js
ctx.attributes.graphviz.engine = 'fdp'

var providerName = 'openstack'

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
