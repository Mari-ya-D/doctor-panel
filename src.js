document.getElementById('send').addEventListener('click', () => {
     fetch(`/consultations/${id}/reply`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ answer: 'Привет, сервер!' })
     })
       .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
       .then(data => console.log('Ответ от сервера:', data))
       .catch(err => console.error('Ошибка:', err));
   });