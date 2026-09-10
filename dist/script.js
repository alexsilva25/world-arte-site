const button = document.querySelector('.menu-button');
const menu = document.querySelector('.menu');

button?.addEventListener('click', () => {
  const open = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!open));
  menu?.classList.toggle('open', !open);
});

menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  menu.classList.remove('open');
  button?.setAttribute('aria-expanded', 'false');
}));

document.querySelector('#year').textContent = new Date().getFullYear();

const lightbox = document.querySelector('.image-lightbox');
const lightboxImage = lightbox?.querySelector('img');
const lightboxCaption = lightbox?.querySelector('p');

document.querySelectorAll('.mug-open').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const image = trigger.querySelector('img');
    const caption = trigger.closest('figure')?.querySelector('figcaption')?.textContent || '';
    if (!lightbox || !lightboxImage || !image) return;
    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    if (lightboxCaption) lightboxCaption.textContent = caption;
    lightbox.showModal();
  });
});

lightbox?.querySelector('.lightbox-close')?.addEventListener('click', () => lightbox.close());
lightbox?.addEventListener('click', (event) => {
  if (event.target === lightbox) lightbox.close();
});
