// M3: Bind events from JavaScript (Zero inline event handlers)
document.addEventListener('DOMContentLoaded', () => {
  // Tìm form liên hệ trong trang
  const contactForm = document.querySelector('form');

  if (contactForm) {
    contactForm.addEventListener('submit', (event) => {
      // Ngăn hành vi reload trang mặc định của form
      event.preventDefault();

      // Lấy dữ liệu an toàn từ ô input
      const nameInput = document.getElementById('name');
      const nameValue = nameInput ? nameInput.value.trim() : 'Guest';

      // M3: Safe DOM Mutation (Tuyệt đối KHÔNG dùng innerHTML)
      // Tạo phần tử text an toàn để chống XSS
      const feedbackMessage = document.createElement('p');
      feedbackMessage.textContent = `Thank you, ${nameValue}! Your message has been received securely.`;
      
      // Thêm style cho thông báo (dùng CSS variables đã định nghĩa ở M1)
      feedbackMessage.style.color = 'var(--accent-color)';
      feedbackMessage.style.fontWeight = 'bold';
      feedbackMessage.style.marginTop = '1rem';

      // Thay thế form bằng dòng thông báo
      contactForm.replaceWith(feedbackMessage);
    });
  }
});