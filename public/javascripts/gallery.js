document.addEventListener('DOMContentLoaded', function(evt) {
  let photos;
  let photoTemplate = document.querySelector('#photos').innerHTML;
  const buildPhotos = Handlebars.compile(photoTemplate);

  let infoTemplate = document.querySelector('#photo_information').innerHTML;
  const buildInfo = Handlebars.compile(infoTemplate);

  const slidesDiv = document.body.querySelector('#slides');
  const infoHeader = document.querySelector('#photo_info_header');

  const commentsDiv = document.querySelector('#comments');

  Handlebars.registerPartial('photo_comment', document.querySelector('#photo_comment').innerHTML);
  let pc = document.querySelector('#photo_comment').innerHTML;
  let buildOneComment = Handlebars.compile(pc);

  let commentsTemplate = document.querySelector('#photo_comments').innerHTML;
  const buildComments = Handlebars.compile(commentsTemplate);


  fetch(
    '/photos',
    {method: 'GET'}
  ).then((response) => {
    return response.json();
  }).then((data) => {
    photos = data;
    slidesDiv.innerHTML += buildPhotos({photos: data});
    renderPhotoInfo(1);
    importComments(1);
    slideshow.init();
    activateButtons();
  });

  function activateButtons() {
    let photo_id = slideshow.currentSlide.getAttribute('data-id');
    let favorite = document.querySelector('a.button.favorite');
    let like = document.querySelector('a.button.like');

    like.addEventListener('click', function(event) {
      event.preventDefault();

      fetch(
      '/photos/like',
      {method: 'POST',
       headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
       body: `photo_id=${photo_id}`}
      ).then(response => {
        return response.json();
      }).then(likeData => {
        like.innerText = like.innerText.replace(/\d+/g, String(likeData.total));
      });
    });

    favorite.addEventListener('click', function(event) {
      event.preventDefault();

      fetch(
      '/photos/favorite',
      {method: 'POST',
       headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
       body: `photo_id=${photo_id}`}
      ).then(response => {
        return response.json();
      }).then(favoriteData => {
        favorite.innerText = favorite.innerText.replace(/\d+/g, String(favoriteData.total));
      });
    });
  }

  function renderPhotoInfo(id) {
    let photo = photos.filter(item => item.id === id)[0];
    let header = document.querySelector("#photo_info_header");
    header.innerHTML = buildInfo(photo);
  };

  function importComments(id) {
    fetch(
      `/comments?photo_id=${id}`,
      {method: 'GET'}
    ).then(response => {
      return response.json();
    }).then(commentData => {
      let commentList = commentsDiv.querySelector('ul');
      commentList.innerHTML = buildComments({comments: commentData});
    });
  };

  // flesh out the slideshow obj to create a protoype within the main fetch call
  const slideshow = {
    next(event) {
      event.preventDefault();
      let next = this.currentSlide.nextElementSibling;
      if(!next) {
        next = this.firstSlide;
      }
      this.renderPhotoContent(next.getAttribute('data-id'));
      this.fadeOut(this.currentSlide);
      this.fadeIn(next);
      this.currentSlide = next;
      activateButtons();

    },

    prev(event) {
      event.preventDefault();
      let prev = this.currentSlide.previousElementSibling;
      if(!prev) {
        prev = this.lastSlide;
      }
      this.renderPhotoContent(prev.getAttribute('data-id'));
      this.fadeOut(this.currentSlide);
      this.fadeIn(prev);
      this.currentSlide = prev;
      activateButtons();

    },

    fadeOut(slide) {
      slide.classList.remove('shown');
      slide.classList.add('hidden');
    },

    fadeIn(slide) {
      slide.classList.remove('hidden');
      slide.classList.add('shown');
    },
    renderPhotoContent: function(idx) {
    renderPhotoInfo(Number(idx));
    importComments(idx);
    },

    bind() {
      let prevButton = document.querySelector('a.prev');
      let nextButton = document.querySelector('a.next');
      prevButton.addEventListener('click', (event) => {this.prev(event)});
      nextButton.addEventListener('click', (event) => {this.next(event)});
    },

    init() {
      this.slideshow = document.querySelector('#slideshow');
      let slides = this.slideshow.querySelectorAll('figure');
      this.currentSlide = slides[0];
      this.firstSlide = slides[0];
      this.lastSlide = slides[slides.length - 1];
      this.bind();
    },
  };

  document.querySelector('form').addEventListener('submit', function(e) {
    e.preventDefault();
    let form = e.target;
    let href = form.action;
    let method = form.getAttribute("method");
    let fd = new FormData(form);
    let currentSlideId = slideshow.currentSlide.getAttribute('data-id');
    fd.set('photo_id', currentSlideId);

    fetch(
      href,
      {method: method,
       headers: {"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"},
       body: new URLSearchParams([...fd]),}
    ).then(response => {
      return response.json();
    }).then(data => {
      let html = buildOneComment(data);
      commentsDiv.querySelector('ul').insertAdjacentHTML('beforeend', html);
      form.reset();
    });
  })
});
