const DEFAULT_THRESHOLDS = {
  packetsPerSecond: 1000,
  uniqueSources: 50,
  burstDuration: 5
};

export const detectDoSAttack = (
  packetsPerSecond,
  uniqueSources,
  duration,
  thresholds = DEFAULT_THRESHOLDS
) => {
  return (
    packetsPerSecond > thresholds.packetsPerSecond &&
    uniqueSources > thresholds.uniqueSources &&
    duration > thresholds.burstDuration
  );
};

export const analyzeTrafficPattern = (packets) => {
  const packetsPerSecond = packets.length;
  const uniqueSources = new Set(packets.map(p => p.source)).size;
  
  console.log(`Analyzing traffic: ${packetsPerSecond} pps, ${uniqueSources} sources`);

  if (detectDoSAttack(packetsPerSecond, uniqueSources, 5)) {
    return {
      isAttack: true,
      type: uniqueSources > 100 ? 'DDoS Attack' : 'DoS Attack',
      details: `High traffic detected: ${packetsPerSecond} packets/sec from ${uniqueSources} sources`
    };
  }

  return {
    isAttack: false,
    type: 'Normal Traffic',
    details: 'Traffic patterns within normal range'
  };
};
