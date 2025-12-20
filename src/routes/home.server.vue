<template>
	<Counter />
	<vue-head :input="{ title: 'PicPic' }" />
</template>
<script lang="ts" setup>
import { VueHead } from '@/components/Layout/Head';
import Counter from './sfc/counter.vue';
</script>
