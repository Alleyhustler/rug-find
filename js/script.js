window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  const loaderVideo = document.getElementById('loader-video');

  // Masquer le loader après que la vidéo de chargement se termine
  loaderVideo.addEventListener('ended', () => {
    loader.classList.add('hidden'); // Ajout de la classe pour une transition
    setTimeout(() => {
      loader.style.display = 'none'; // Suppression de l'élément après la transition
    }, 1000); // Temps correspondant à la transition CSS
  });
});

// Fonction pour récupérer les données du NFT et générer les données du personnage
async function fetchNftDataAndGenerateCharacter(input) {
  const submitLoader = document.getElementById('submit-loader');
  const dark = document.getElementById('dark-background');

  try {
    const response = await fetch(`https://corsproxy.io/?key=bc45ba56&url=https://api-mainnet.magiceden.dev/v2/tokens/${input}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data) {
      const imageUri = data.image;
      const nameFromApi = data.name; // Récupérer le nom du NFT
      console.log('Image URI:', imageUri);

      // Appeler la fonction pour générer les données du personnage avec le nom et l'image
      await generateCharacterDataFromApi(nameFromApi, imageUri);
    } else {
      alert('Failed to retrieve NFT data.');
    }
  } catch (error) {
    console.error('Error fetching data from API:', error);
    alert('An error occurred while fetching NFT data.');
  } finally {
    submitLoader.style.display = 'none';
    dark.style.display = 'none';
  }
}


// Fonction pour générer les données du personnage avec ChatGPT
async function generateCharacterDataFromApi(nameFromApi, nftImage) {
  const submitLoader = document.getElementById('submit-loader');
  const dark = document.getElementById('dark-background');
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': ',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `Generate a personality, and background for a character based on this image: ${nftImage}. The character's name is ${nameFromApi}. Please keep the response short, max 25 words for the background and 30 words for personality.`
          }
        ],
        max_tokens: 200 // Limiter la longueur de la réponse
      })
    });

    const data = await response.json();

    if (data && data.choices && data.choices[0].message) {
      const responseText = data.choices[0].message.content;
      console.log('Generated response:', responseText);

      // Extraction des données de personnalité et de background
      const personalityMatch = responseText.match(/Personality:\s*([\s\S]*?)(?:\n\s*Background:|$)/);
      const backgroundMatch = responseText.match(/^([\s\S]*?)(?=\*\*Personality)/);
      const cleanBackground = backgroundMatch ? backgroundMatch[1].replace('**Background:**', '').trim() : 'No Personnality details available';
      const cleanPerso = personalityMatch ? personalityMatch[1].replace('** ', '').trim() : 'No background details available';

      // Création des données du personnage
      const characterData = {
        name: nameFromApi,  // Utiliser le nom provenant de l'API
        personality: cleanPerso,
        background: cleanBackground,
        image: nftImage // Utiliser l'image du NFT
      };

      // Appeler la fonction pour afficher les données du personnage et envoyer le formulaire
      reviveCharacter(characterData.name, characterData.personality, characterData.background, characterData.image);
    } else {
      console.error('No valid response from the API');
    }
  } catch (error) {
    console.error('Error generating character data:', error);
    alert('An error occurred while generating character data.');
  }
}

// Fonction pour soumettre les données du personnage généré
function reviveCharacter(name, personality, background, image) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = './chat/';

  const cleanedName = encodeURIComponent(name);
  const cleanedPersonality = encodeURIComponent(personality);
  const cleanedBackground = encodeURIComponent(background);
  const cleanedImage = encodeURIComponent(image); // Encodage de l'URL de l'image

  const nameInput = document.createElement('input');
  nameInput.type = 'hidden';
  nameInput.name = 'name';
  nameInput.value = cleanedName;

  const personalityInput = document.createElement('input');
  personalityInput.type = 'hidden';
  personalityInput.name = 'personality';
  personalityInput.value = cleanedPersonality;

  const backgroundInput = document.createElement('input');
  backgroundInput.type = 'hidden';
  backgroundInput.name = 'background';
  backgroundInput.value = cleanedBackground;

  const imageInput = document.createElement('input'); // Nouveau champ caché pour l'image
  imageInput.type = 'hidden';
  imageInput.name = 'image'; // Nom de l'input pour l'image
  imageInput.value = cleanedImage;

  form.appendChild(nameInput);
  form.appendChild(personalityInput);
  form.appendChild(backgroundInput);
  form.appendChild(imageInput); // Ajouter l'image au formulaire

  document.body.appendChild(form);
  form.submit();
}

// Fonction pour afficher un loader et récupérer l'adresse NFT
document.querySelector('.mint-btn').addEventListener('click', async () => {
  const input = document.querySelector('.mint-input').value.trim();
  const submitLoader = document.getElementById('submit-loader');
  const dark = document.getElementById('dark-background');

  if (!submitLoader) {
    console.error('submit-loader element not found');
    return;
  }

  if (input) {
    submitLoader.style.display = 'flex';
    dark.style.display = 'block';

    await fetchNftDataAndGenerateCharacter(input); // Récupérer les données et générer les données du personnage
  } else {
    alert('Please enter a valid address!');
  }
});
