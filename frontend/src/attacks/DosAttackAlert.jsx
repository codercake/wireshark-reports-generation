import React from 'react';

const DosAttackAlert = ({ dosAttacks }) => {
  return (
    <div>
      <h3>Potential DoS Attacks Detected</h3>
      <ul>
        {dosAttacks.map((attack, index) => (
          <li key={index}>
            IP: {attack.ip}, Count: {attack.count}, Start: {attack.start_time}, End: {attack.end_time}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DosAttackAlert;
