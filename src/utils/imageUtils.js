import { supabase } from '../lib/supabase';

export const loadImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const blurImagePlates = async (file, boxes) => {
  if (!boxes || boxes.length === 0) return file;
  
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  
  ctx.drawImage(img, 0, 0);
  
  boxes.forEach(box => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; // Tarja preta sólida para máxima privacidade
    ctx.fillRect(box.xmin, box.ymin, box.xmax - box.xmin, box.ymax - box.ymin);
  });
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const newFile = new File([blob], file.name, { type: file.type });
      resolve(newFile);
    }, file.type, 0.9);
  });
};

export const detectAndBlur = async (file) => {
  try {
    const formData = new FormData();
    formData.append('upload', file);
    // Para funcionar corretamente, o supabase precisa do form-data cru sem ser convertido a string
    const { data: funcData, error } = await supabase.functions.invoke('super-service', {
      body: formData,
    });
    
    if (error) {
       console.error("Erro na Edge Function plate-recognizer", error);
       alert("Erro na nuvem (Supabase): " + (error.message || JSON.stringify(error)));
       return file; 
    }
    
    if (funcData && funcData.results && funcData.results.length > 0) {
       const boxes = funcData.results.map(r => r.box);
       return await blurImagePlates(file, boxes);
    }
    
    console.log("Nenhuma placa detectada pela IA nesta imagem.");
    return file;
  } catch(e) {
    console.error("Erro detectAndBlur:", e);
    alert("Falha de conexão com a IA: " + e.message);
    return file; 
  }
};
