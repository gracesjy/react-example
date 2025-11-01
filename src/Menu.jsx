import React from 'react';
import './Menu.css';

const Menu = () => {
  const menuItems = [
    { name: 'Home', link: '#home' },
    { name: 'About', link: '#about' },
    {
      name: 'Services',
      subItems: [
        { name: 'Web Development', link: '#web' },
        { name: 'Mobile Apps', link: '#mobile' },
        { name: 'UI/UX Design', link: '#design' },
      ],
    },
    { name: 'Contact', link: '#contact' },
  ];

  return (
    <nav className="menu">
      <ul className="menu-list">
        {menuItems.map((item, idx) => (
          <li key={idx} className="menu-item">
            <a href={item.link || '#'} className="menu-link">
              {item.name}
            </a>
            {item.subItems && (
              <ul className="submenu">
                {item.subItems.map((sub, subIdx) => (
                  <li key={subIdx} className="submenu-item">
                    <a href={sub.link} className="submenu-link">
                      {sub.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Menu;