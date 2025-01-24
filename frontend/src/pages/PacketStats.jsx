import React from 'react';

const PacketStats = ({ stats }) => {
  const protocols = stats?.protocols || {};

  const protocolCounts = Object.keys(protocols || {}).reduce((acc, protocol) => {
    acc.push({ protocol, count: protocols[protocol] });
    return acc;
  }, []);

  return (
    <div>
      <h2>Packet Statistics</h2>
      <ul>
        {protocolCounts.map(({ protocol, count }) => (
          <li key={protocol}>
            {protocol}: {count}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PacketStats;
