<template>
    <div class="flex flex-col">
        <h1>Welcome to PicPic!</h1>
        <p>This is the main page of the PicPic application.</p>
        <Suspense>
            <MyLazyComponent />
            <template #fallback>
                <div>Loading MyLazyComponent...</div>
            </template>
        </Suspense>
    </div>
</template>
<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';

const MyLazyComponent = defineAsyncComponent(() =>
    import('./sfc/counter.vue')
);
console.log("home.server.vue loaded");
</script>