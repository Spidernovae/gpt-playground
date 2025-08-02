import { createApp, ref, onMounted } from 'vue';

const App = {
  setup() {
    const message = ref('');
    const randomNumber = ref(null);

    const fetchData = async () => {
      const query = `
        query {
          hello
          randomNumber
        }
      `;
      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const { data } = await response.json();
      message.value = data.hello;
      randomNumber.value = data.randomNumber;
    };

    onMounted(fetchData);

    return { message, randomNumber, fetchData };
  },
  template: `
    <div>
      <h1>{{ message }}</h1>
      <p>Random number: {{ randomNumber }}</p>
      <button @click="fetchData">Refresh</button>
    </div>
  `
};

createApp(App).mount('#app');
