/* =======================================================
   QEEPP Global Scripts
   Version: 1.0
   ======================================================= */

	const form = document.getElementById('contactForm');

	form.addEventListener('submit', async function(e) {
	  e.preventDefault();

	  const data = new FormData(form);

	  const response = await fetch(form.action, {
		method: 'POST',
		body: data,
		headers: { 'Accept': 'application/json' }
	  });

	  if (response.ok) {
		alert('Thank you for your message.');
		form.reset();
	  } else {
		alert('Something went wrong. Please try again.');
	  }
	});
