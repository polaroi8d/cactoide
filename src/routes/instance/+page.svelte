<script lang="ts">
	interface InstanceData {
		url: string;
		name: string | null;
		events: number | null;
		healthStatus: 'healthy' | 'unhealthy' | 'unknown';
		responseTime: number | null;
		error?: string;
	}

	type InstancePageData = {
		instances: InstanceData[];
	};

	export let data: InstancePageData;

	function getStatusColor(responseTime: number | null): string {
		if (responseTime === null) return 'bg-gray-400';
		if (responseTime < 10) return 'bg-green-500';
		if (responseTime <= 30) return 'bg-yellow-500';
		return 'bg-red-500';
	}

	function formatResponseTime(responseTime: number | null): string {
		if (responseTime === null) return 'N/A';
		return `${responseTime} ms`;
	}
</script>

<div class="container mx-auto px-4 py-16 text-white">
	<div class="overflow-x-auto">
		<table class="min-w-full rounded-lg border border-slate-600 bg-slate-800/50 shadow-sm">
			<thead class="bg-slate-800">
				<tr>
					<th
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-400 uppercase"
					>
						Name
					</th>
					<th
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-400 uppercase"
					>
						URL
					</th>
					<th
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-400 uppercase"
					>
						Events
					</th>
					<th
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-400 uppercase"
					>
						Health Status
					</th>
					<th
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-400 uppercase"
					>
						Response Time
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-700">
				{#each data.instances as instance, i (i)}
					<tr class="hover:bg-slate-700/50">
						<td class="px-6 py-4 whitespace-nowrap">
							<span class="text-sm font-medium text-slate-300">
								{instance.name || 'N/A'}
							</span>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<a
								href="http://{instance.url}"
								target="_blank"
								rel="noopener noreferrer"
								class="text-sm text-slate-400 hover:text-violet-300/80"
							>
								{instance.url}
							</a>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<span class="text-sm text-slate-300">
								{instance.events !== null ? instance.events : 'N/A'}
							</span>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<div class="flex items-center">
								<span
									class="mr-2 inline-block h-3 w-3 rounded-full {getStatusColor(
										instance.responseTime
									)}"
									title={instance.healthStatus}
								></span>
								<span class="text-sm text-slate-300 capitalize">
									{instance.healthStatus}
								</span>
								{#if instance.error}
									<span class="ml-2 text-xs text-slate-500">({instance.error})</span>
								{/if}
							</div>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<div class="flex items-center">
								<span
									class="mr-2 inline-block h-3 w-3 rounded-full {getStatusColor(
										instance.responseTime
									)}"
								></span>
								<span class="text-sm text-slate-300">
									{formatResponseTime(instance.responseTime)}
								</span>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<p class="py-8 text-center text-slate-400">
			These are the instances that are part of the github original federation list, if you want to
			add your instance to the list, please open a pull request to the <a
				href="https://github.com/cactoide/cactoide/blob/main/federation.config.js"
				class="text-violet-300/80">federation.config.js</a
			> file.
		</p>

		{#if data.instances.length === 0}
			<div class="py-8 text-center text-slate-500">No federation instances configured.</div>
		{/if}
	</div>
</div>

<style>
	/* Additional styles if needed */
</style>
