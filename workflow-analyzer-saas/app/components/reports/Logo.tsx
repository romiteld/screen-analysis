import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBox: {
    width: 40,
    height: 40,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
});

interface LogoProps {
  companyName?: string;
}

const Logo: React.FC<LogoProps> = ({ companyName = 'Workflow Analyzer Pro' }) => {
  return (
    <View style={styles.logoContainer}>
      <View style={styles.logoBox}>
        <Text style={styles.logoText}>W</Text>
      </View>
      <Text style={styles.companyName}>{companyName}</Text>
    </View>
  );
};

export default Logo;