async function loadDestinations() {
  const res = await fetch('http://localhost:5000/destinations');
  const destinations = await res.json();
  const select = document.getElementById('destination');
  destinations.forEach((d) => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = d;
    select.appendChild(opt);
  });
}

async function generate() {
  const destination = document.getElementById('destination').value;
  const preferences = document.getElementById('preferences').value;
  const res = await fetch(
    `http://localhost:4000/playlist?destination=${encodeURIComponent(
      destination
    )}&preferences=${encodeURIComponent(preferences)}`
  );
  const data = await res.json();
  const list = document.getElementById('playlist');
  list.innerHTML = '';
  data.tracks.forEach((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    list.appendChild(li);
  });
}

document.getElementById('generate').addEventListener('click', generate);

loadDestinations();
