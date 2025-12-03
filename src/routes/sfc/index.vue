<template>
    <div>
        <h1>SFC Component - ID: {{ id }}</h1>
        <p>This is a single file component with dynamic routing.</p>
    </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue';

    const id = ref('123');
</script>