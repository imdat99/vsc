<script setup lang="ts">
import { ref } from "vue";
const count = ref(0);
</script>

<template>
	<div style="padding: 0.5rem; border: 1px solid #bbb; background-color: #fee">
		<div style="margin-bottom: 0.5rem;">
			<button class="btn btn-outline-primary" @click="count++">client counter {{ count }}</button>
		</div>
		<slot v-if="count % 2 === 0"></slot>
	</div>
</template>
