<template>
  <div class="sidebar" ref="sidebar">
    <div class="sidebar__list">
      <ul id="list">
        <p class="list-group-title">{{ sheetName }}</p>
        <li v-for="d in props.children" :key="d.id" class="list-group-item">
          <p class="list-sub-group-item" @click="handleClick(d)">
            {{ d["Entry Name"] }}
          </p>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Supply, type Demand, isSupply } from "@/stores/soilSisters";

import { ref, onMounted } from "vue";

const props = defineProps({
  sheetName: {
    type: String,
    required: true,
  },
  children: {
    type: Array as () => Array<Supply | Demand>,
    required: true,
  },
  pos: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["update:selectedItem"]);

const sidebar = ref<HTMLElement | null>(null);

const handleClick = (item: Supply | Demand) => {
  if (isSupply(item)) {
    emit("update:selectedItem", item, "supply");
  } else if (!isSupply(item)) {
    emit("update:selectedItem", item, "demand");
  }
};

onMounted(() => {
  props.pos === "right"
    ? sidebar.value?.classList.add("right")
    : sidebar.value?.classList.add("left");
});
</script>

<style lang="scss" scoped>
.sidebar {
  position: fixed;
  margin: 1rem;
  margin-top: 4rem;
  pointer-events: none;
  width: 90%;
  height: 90%;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-block: 2rem;
  --bg-clr: #51834315;

  &.right {
    right: 0;
  }

  &.left {
    left: 0;
    flex-direction: row-reverse;
  }

  & > * {
    pointer-events: auto;
  }

  .sidebar__details {
    width: 30%;
    height: fit-content;
    max-height: 90%;
    overflow-y: scroll;
    background-color: var(--bg-clr);
    backdrop-filter: blur(5px);
    border-radius: 0.5rem;
    padding: 1em;

    &::-webkit-scrollbar {
      display: none;
    }

    p.title {
      color: #bebebe;
      border-bottom: 1px solid #e5e5e5;
    }

    button {
      position: absolute;
      top: 1em;
      right: 1em;
      background-color: transparent;
      border: none;
      cursor: pointer;
      outline: none;
      transition: transform 0.2s ease-in-out;

      svg {
        width: 1em;
        height: 1em;
      }

      &:hover {
        transform: scale(1.2);
      }
    }

    .item__key {
      color: #bebebe;
    }
  }
  .sidebar__list {
    width: 20%;
    height: 90%;
    background-color: var(--bg-clr);
    backdrop-filter: blur(5px);
    border-right: 1px solid #e5e5e5;
    border-radius: 0.5rem;

    #list {
      padding-block: 1em;
      padding-inline: 1em;
      /* hide scroll bar */
      &::-webkit-scrollbar {
        display: none;
      }
      .list-group-title {
        border-bottom: 1px solid #e5e5e5;
        color: #bebebe;
      }

      .list-group-item {
        text-transform: capitalize;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.455, 0.03, 0.515, 0.955);

        &:hover {
          background-color: #51834325;
          padding-block: 0.15rem;
          padding-inline-start: 0.5rem;
        }
      }
    }
  }
}
</style>
