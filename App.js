import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, Dimensions, TouchableOpacity, TextInput, Modal,
  SafeAreaView, StatusBar, ActivityIndicator, FlatList, Alert, Linking, Platform, ImageBackground
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { CreditCard, Plus, X, ShieldCheck, Zap, History, Smartphone, ChevronRight } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, interpolate, Extrapolate, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

// --- CONSTANTS & THEME ---
const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const CARD_HEIGHT = 230;
const AXIS_URL = 'https://pgi.billdesk.com/pgidsk/pgmerc/axiscard/axis_card.jsp';

const THEME = {
  bg: '#050505',         // Pure Void Black
  surface: '#121212',    // Deep Surface
  goldStart: '#FFD700',  // Pure Gold
  goldEnd: '#BF953F',    // Darker Gold
  accent: '#6C5CE7',     // Royal Purple
  text: '#FFFFFF',
  dim: '#555555',
  danger: '#FF4444',
  success: '#00D26A'
};

// --- THE IMMORTAL BOT SCRIPT (RETRY LOGIC ADDED) ---
const getGhostScript = (card, amount, email, phone) => `
  (function() {
    const log = (msg) => window.ReactNativeWebView.postMessage(JSON.stringify({type: 'LOG', msg}));
    
    // 1. ROBUST TYPER
    async function humanType(selector, text, retries = 5) {
      let element = null;
      // Try finding element multiple times
      for(let i=0; i<retries; i++) {
          element = document.querySelector(selector) || document.getElementById(selector);
          if(element) break;
          await new Promise(r => setTimeout(r, 500)); // Wait 500ms before retry
      }

      if (!element) { log('Could not find ' + selector); return; }

      element.focus();
      element.value = ''; 
      element.dispatchEvent(new Event('input', { bubbles: true }));
      
      for (let char of text) {
        element.value += char;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise(r => setTimeout(r, 50 + Math.random() * 50));
      }
      element.blur();
      log('Filled ' + selector);
    }

    // 2. MAIN LOGIC
    async function run() {
      try {
        log('Bot Awake. Scanning...');

        // Radio Buttons
        const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
        const target = '${card.number.startsWith('4') ? 'VISA' : 'MASTER'}';
        radios.forEach(r => {
            if(r.nextSibling?.textContent?.toUpperCase().includes(target)) r.click();
        });

        // Split Inputs (The 4 Box Logic)
        const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="password"], input[type="tel"]'));
        const boxInputs = inputs.filter(i => i.maxLength === 4 && !i.disabled && i.style.display !== 'none');

        if (boxInputs.length >= 8) {
           log('Split Input Mode Detected');
           const parts = ['${card.number.slice(0,4)}', '${card.number.slice(4,8)}', '${card.number.slice(8,12)}', '${card.number.slice(12,16)}'];
           // Fill First Row
           for(let i=0; i<4; i++) { 
             if(boxInputs[i]) {
                boxInputs[i].value = parts[i]; 
                boxInputs[i].dispatchEvent(new Event('input')); 
                await new Promise(r=>setTimeout(r, 100)); 
             }
           }
           // Fill Second Row (Re-enter)
           for(let i=4; i<8; i++) { 
             if(boxInputs[i]) {
                boxInputs[i].value = parts[i]; 
                boxInputs[i].dispatchEvent(new Event('input')); 
                await new Promise(r=>setTimeout(r, 100)); 
             }
           }
        } else {
           // Single Box Mode
           await humanType('input[name*="card"]', '${card.number}');
        }

        // Contact Info
        await humanType('input[name*="mail"]', '${email}'); // Email
        await humanType('input[name*="mobile"]', '${phone}'); // Phone
        await humanType('input[name*="amount"]', '${amount}'); // Amount

      } catch (e) { log('Error: ' + e.message); }
    }
    
    // UPI AUTO-CLICKER
    setInterval(() => {
       const upi = Array.from(document.querySelectorAll('div,span,a,label')).find(e => e.innerText.includes('UPI') || e.innerText.includes('Unified'));
       if(upi) upi.click();
    }, 2000);

    setTimeout(run, 1500);
  })();
`;

// --- LUXURY COMPONENTS ---

const LuxuryCard = ({ item, index, scrollX, onPress }) => {
  const rnStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const scale = interpolate(scrollX.value, inputRange, [0.9, 1, 0.9], Extrapolate.CLAMP);
    const rotateY = interpolate(scrollX.value, inputRange, [20, 0, -20], Extrapolate.CLAMP); // 3D Effect
    return { transform: [{ scale }, { perspective: 1000 }, { rotateY: `${rotateY}deg` }] };
  });

  return (
    <View style={{ width: width, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[styles.cardContainer, rnStyle]}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => { Haptics.selectionAsync(); onPress(item); }} style={styles.cardInner}>
          <LinearGradient
            colors={['#1A1A1A', '#000000']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            {/* Gold Border Effect */}
            <View style={styles.goldBorder} />
            
            <View style={styles.cardTop}>
              <Text style={styles.bankName}>{item.bankName.toUpperCase()}</Text>
              <View style={styles.shinyIcon}>
                 <ShieldCheck color={THEME.goldStart} size={20} />
              </View>
            </View>

            <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 20}}>
               <View style={styles.chip} />
               <Zap color="#444" size={20} style={{marginLeft: 15}} />
            </View>

            <Text style={styles.cardNumber}>
              {item.number.replace(/(.{4})/g, '$1  ').trim()}
            </Text>

            <View style={styles.cardBottom}>
              <View>
                <Text style={styles.label}>CARD HOLDER</Text>
                <Text style={styles.value}>{item.name.toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.label}>EXPIRES</Text>
                <Text style={styles.value}>{item.expiry}</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// --- MAIN APP ---

export default function App() {
  const [cards, setCards] = useState([]);
  const [history, setHistory] = useState([]);
  const [view, setView] = useState('DASHBOARD'); 
  const [activeCard, setActiveCard] = useState(null);
  const [amount, setAmount] = useState('');
  
  const scrollX = useSharedValue(0);

  useEffect(() => { loadVault(); }, []);

  const loadVault = async () => {
    try {
      const c = await SecureStore.getItemAsync('elite_cards');
      const h = await SecureStore.getItemAsync('elite_history');
      if (c) setCards(JSON.parse(c));
      if (h) setHistory(JSON.parse(h));
    } catch(e) {}
  };

  const saveCard = async (d) => {
    const n = [...cards, {...d, id: Date.now().toString()}];
    setCards(n);
    await SecureStore.setItemAsync('elite_cards', JSON.stringify(n));
    setView('DASHBOARD');
  };

  // UPI BRIDGE
  const handleRequest = (req) => {
    if(req.url.startsWith('upi:') || req.url.startsWith('gpay:') || req.url.startsWith('phonepe:')) {
      Linking.openURL(req.url);
      return false;
    }
    return true;
  };

  const handleNav = (s) => {
    if(s.url.toLowerCase().includes('success')) {
       const tx = {id: Date.now().toString(), bank: activeCard.bankName, amount: amount, date: new Date().toLocaleDateString()};
       const nH = [tx, ...history];
       setHistory(nH);
       SecureStore.setItemAsync('elite_history', JSON.stringify(nH));
       Alert.alert('Payment Successful');
       setView('DASHBOARD');
    }
  };

  if (view === 'PAYMENT') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
        <StatusBar barStyle="light-content" />
        <View style={styles.navBar}>
           <TouchableOpacity onPress={() => setView('DASHBOARD')}><X color="white" size={24} /></TouchableOpacity>
           <Text style={{color:'white', fontWeight:'bold'}}>SECURE GATEWAY</Text>
           <ActivityIndicator color={THEME.goldStart} />
        </View>
        <WebView
          source={{ uri: AXIS_URL }}
          injectedJavaScript={getGhostScript(activeCard, amount, activeCard.email, activeCard.phone)}
          onShouldStartLoadWithRequest={handleRequest}
          onNavigationStateChange={handleNav}
          javaScriptEnabled domStorageEnabled
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[THEME.bg, '#101010']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={{flex: 1}}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>ELITE</Text>
            <Text style={styles.subBrand}>AUTOMATION</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setView('FORM'); }}>
            <Plus color="black" size={24} />
          </TouchableOpacity>
        </View>

        {/* CARD STACK */}
        <View style={{ height: CARD_HEIGHT + 40 }}>
          <Animated.FlatList
            data={cards}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={width}
            decelerationRate="fast"
            contentContainerStyle={{ alignItems: 'center' }}
            onScroll={(e) => scrollX.value = e.nativeEvent.contentOffset.x}
            keyExtractor={i => i.id}
            renderItem={({ item, index }) => (
              <LuxuryCard 
                item={item} index={index} scrollX={scrollX}
                onPress={(c) => {
                   setActiveCard(c);
                   Alert.prompt("Pay Bill", "Enter Amount", [
                     {text:"Cancel", style:"cancel"},
                     {text:"PAY", onPress: amt => { if(amt){ setAmount(amt); setView('PAYMENT'); }}}
                   ], "plain-text", "", "number-pad");
                }}
              />
            )}
            ListEmptyComponent={
                <View style={styles.empty}>
                    <Text style={{color: THEME.dim}}>NO CARDS IN VAULT</Text>
                </View>
            }
          />
        </View>

        {/* HISTORY */}
        <View style={styles.historyBox}>
            <Text style={styles.sectionTitle}>RECENT TRANSACTIONS</Text>
            <FlatList
                data={history}
                keyExtractor={i => i.id}
                renderItem={({item}) => (
                    <View style={styles.txRow}>
                        <View style={styles.iconBox}><History color={THEME.goldStart} size={16}/></View>
                        <View style={{flex:1}}>
                            <Text style={styles.txTitle}>{item.bank}</Text>
                            <Text style={styles.txDate}>{item.date}</Text>
                        </View>
                        <Text style={styles.txAmount}>- ₹{item.amount}</Text>
                    </View>
                )}
            />
        </View>

        {/* MODAL FORM */}
        <Modal visible={view === 'FORM'} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                <View style={styles.modalContent}>
                    <Text style={styles.modalHeader}>ADD NEW CARD</Text>
                    <AddForm onSave={saveCard} onCancel={() => setView('DASHBOARD')} />
                </View>
            </View>
        </Modal>

      </SafeAreaView>
    </View>
  );
}

const AddForm = ({onSave, onCancel}) => {
    const [f, setF] = useState({bankName: 'Axis Bank', number: '', name: '', expiry: '', email: '', phone: ''});
    const inputs = [
        {p: 'Bank Name', k: 'bankName'}, {p: 'Card Number (16 digits)', k: 'number', pad: true, max: 16},
        {p: 'Name on Card', k: 'name'}, {p: 'Expiry (MM/YY)', k: 'expiry'},
        {p: 'Email', k: 'email', mail: true}, {p: 'Phone', k: 'phone', pad: true}
    ];
    return (
        <View>
            {inputs.map((i, idx) => (
                <TextInput 
                    key={idx} style={styles.input} placeholder={i.p} placeholderTextColor="#444"
                    value={f[i.k]} onChangeText={t => setF({...f, [i.k]: t})}
                    keyboardType={i.pad ? 'number-pad' : i.mail ? 'email-address' : 'default'}
                    maxLength={i.max}
                />
            ))}
            <TouchableOpacity style={styles.saveBtn} onPress={() => onSave(f)}>
                <Text style={{color:'black', fontWeight:'900', letterSpacing:1}}>ENCRYPT & SAVE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{alignItems:'center', padding:15}} onPress={onCancel}><Text style={{color:'#666'}}>CANCEL</Text></TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: { padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: 'white', fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  subBrand: { color: THEME.goldStart, fontSize: 12, fontWeight: 'bold', letterSpacing: 4 },
  addBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: THEME.goldStart, justifyContent: 'center', alignItems: 'center', elevation: 10 },
  
  cardContainer: { width: CARD_WIDTH, height: CARD_HEIGHT, shadowColor: THEME.goldStart, shadowOffset: {width:0, height:10}, shadowOpacity: 0.3, shadowRadius: 20 },
  cardInner: { flex: 1, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
  cardGradient: { flex: 1, padding: 25, justifyContent: 'space-between' },
  goldBorder: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: THEME.goldStart },
  bankName: { color: 'white', fontSize: 20, fontWeight: 'bold', letterSpacing: 2, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 10 },
  cardNumber: { color: 'white', fontSize: 24, fontFamily: Platform.OS==='ios'?'Courier':'monospace', letterSpacing: 3, textShadowColor: 'black', textShadowRadius: 2 },
  chip: { width: 45, height: 32, backgroundColor: '#D4AF37', borderRadius: 6, opacity: 0.8 },
  
  label: { color: '#888', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  value: { color: 'white', fontSize: 14, fontWeight: '600', marginTop: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },

  historyBox: { flex: 1, backgroundColor: '#0A0A0A', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, marginTop: 20 },
  sectionTitle: { color: '#444', fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 20 },
  txRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, padding: 15, backgroundColor: '#111', borderRadius: 15 },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  txTitle: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  txDate: { color: '#666', fontSize: 12 },
  txAmount: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30 },
  modalHeader: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#222', color: 'white', padding: 18, borderRadius: 12, marginBottom: 15, fontSize: 16 },
  saveBtn: { backgroundColor: THEME.goldStart, padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  
  navBar: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#111', alignItems: 'center' },
  empty: { width: width, height: 200, justifyContent: 'center', alignItems: 'center' }
});
