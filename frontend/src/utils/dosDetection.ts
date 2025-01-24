interface PacketThresholds {
    packetsPerSecond: number;
    uniqueSources: number;
    burstDuration: number;
  }
  
  const DEFAULT_THRESHOLDS: PacketThresholds = {
    packetsPerSecond: 1000,
    uniqueSources: 50,
    burstDuration: 5
  };
  
  export const detectDoSAttack = (
    packetsPerSecond: number,
    uniqueSources: number,
    duration: number,
    thresholds: PacketThresholds = DEFAULT_THRESHOLDS
  ): boolean => {
    return (
      packetsPerSecond > thresholds.packetsPerSecond &&
      uniqueSources > thresholds.uniqueSources &&
      duration > thresholds.burstDuration
    );
  };
  
  export const analyzeTrafficPattern = (packets: any[]): {
    isAttack: boolean;
    type: string;
    details: string;
  } => {
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