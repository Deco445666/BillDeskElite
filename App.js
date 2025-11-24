import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Alert,
  Linking,
  Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { CreditCard, Plus, X, ShieldCheck, Zap, History, Smartphone } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  interpolate, 
  Extrapolate 
} from 'react-native-reanimated';

// --- CONSTANTS ---
const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = 240;
const AXIS_URL = 'https://pgi.billdesk.com/pgidsk/pgmerc/axiscard/axis_card.jsp';

const THEME = {
  bg: '#09090B',        // Ultra Dark
  card: '#18181B',      // Surface
  gold: '#FCD34D',      // Luxury Gold
  primary: '#8B5CF6',   // Electric Violet
  text: '#FAFAFA',
  dim: '#71717A',
  success: '#10B981',
  error: '#EF4444',
};

// --- THE GHOST ENGINE (This types for you) ---
const getGhostScript = (card, amount, email, phone) => {
  const isVisa = card.number.startsWith('4');
  
  return `
  (function() {
    const log = (msg) => window.ReactNativeWebView.postMessage(JSON.stringify({type: 'LOG', msg}));
    
    // 1. HUMAN TYPER: Mimics a real person typing
    async function humanType(element, text) {
      if (!element) return;
      element.focus();
      element.value = ''; 
      element.dispatchEvent(new Event('input', { bubbles: true }));
      
      for (let i = 0; i < text.length; i++) {
        element.value += text[i];
        // Fake key presses
        element.dispatchEvent(new Event('keydown', { bubbles: true }));
        element.dispatchEvent(new Event('keypress', { bubbles: true }));
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('keyup', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        // Tiny delay so it looks real
        await new Promise(r => setTimeout(r, 30 + Math.random() * 50));
      }
      element.blur();
    }

    async function runAutomation() {
      try {
        log('Ghost Engine Active...');
        
        // A. RADIO BUTTON SELECTION (Visa vs Master)
        const radios = document.querySelectorAll('input[type="radio"]');
        radios.forEach(r => {
          const label = r.nextSibling?.textContent?.toUpperCase() || '';
          if (label.includes('${isVisa ? "VISA" : "MASTER"}')) r.click();
        });

        // B. FILL CARD NUMBER (Handles split boxes)
        const allInputs = Array.from(document.querySelectorAll('input[type="text"], input[type="password"], input[type="tel"]'));
        const boxInputs = allInputs.filter(i => i.maxLength === 4 && !i.disabled && i.style.display !== 'none');
        
        if (boxInputs.length >= 8) {
           log('Detected Split Input Mode');
           const parts = [
             '${card.number.slice(0,4)}', 
             '${card.number.slice(4,8)}', 
             '${card.number.slice(8,12)}', 
             '${card.number.slice(12,16)}'
           ];
           // Fill first 4 boxes
           for(let i=0; i<4; i++) await humanType(boxInputs[i], parts[i]);
           // Fill confirmation boxes
           for(let i=4; i<8; i++) await humanType(boxInputs[i], parts[i]);
        } else {
           log('Detected Single Input Mode');
           const mainInput = document.querySelector('input[name*="card"]');
           if(mainInput) await humanType(mainInput, '${card.number}');
        }

        // C. FILL CONTACT INFO
        const emailField = document.querySelector('input[name*="mail"]') || document.getElementById('txtEmail');
        const mobileField = document.querySelector('input[name*="mobile"]') || document.getElementById('txtMobile');
        const amountField = document.querySelector('input[name*="amount"]') || document.getElementById('txtBillAmount');

        if(emailField) await humanType(emailField, '${email}');
        if(mobileField) await humanType(mobileField, '${phone}');
        if(amountField) await humanType(amountField, '${amount}');

      } catch (err) {
        log('Error: ' + err.message);
      }
    }

    // D. CLICK UPI TAB (If we see it)
    function attemptUPISelect() {
       const upiTab = Array.from(document.querySelectorAll('div, span, a')).find(el => el.textContent.includes('UPI') || el.textContent.includes('Unified'));
       if(upiTab) upiTab.click();
    }

    setTimeout(runAutomation, 1500);
    setInterval(attemptUPISelect, 3000);
  })();
  `;
};

// --- COMPONENTS ---

const Card = ({ item, index, scrollX, onPress }) => {
  const rnStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const scale = interpolate(scrollX.value, inputRange, [0.9, 1, 0.9], Extrapolate.CLAMP);
    return { transform: [{ scale }] };
  });

  return (
    <View style={{ width: width, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[styles.cardContainer, rnStyle]}>
        <TouchableOpacity activeOpacity={0.95} onPress={() => onPress(item)} style={styles.cardInner}>
          <LinearGradient
            colors={['#27272A', '#000000']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <View style={styles.cardTop}>
              <Text style={styles.bankName}>{item.bankName.toUpperCase()}</Text>
              <ShieldCheck color={THEME.gold} size={20} />
            </View>
            <Text style={styles.cardNumber}>
              {item.number.replace(/(.{4})/g, '$1  ').trim()}
            </Text>
            <View style={styles.cardBottom}>
              <View>
                <Text style={styles.label}>HOLDER</Text>
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

  // Load Data
  useEffect(() => {
    loadVault();
  }, []);

  const loadVault = async () => {
    try {
      const cardsJson = await SecureStore.getItemAsync('elite_cards');
      const histJson = await SecureStore.getItemAsync('elite_history');
      if (cardsJson) setCards(JSON.parse(cardsJson));
      if (histJson) setHistory(JSON.parse(histJson));
    } catch (e) {}
  };

  const saveCard = async (cardData) => {
    const newCards = [...cards, { ...cardData, id: Date.now().toString() }];
    setCards(newCards);
    await SecureStore.setItemAsync('elite_cards', JSON.stringify(newCards));
    setView('DASHBOARD');
  };

  // WEBVIEW: Opens UPI App
  const handleShouldStartLoadWithRequest = (request) => {
    const { url } = request;
    const schemes = ['upi:', 'phonepe:', 'tez:', 'gpay:', 'paytm:'];
    const isUpi = schemes.some(s => url.startsWith(s));

    if (isUpi) {
      Linking.openURL(url).catch(() => {
        Alert.alert('App Not Found', 'Could not open the selected UPI app.');
      });
      return false; 
    }
    return true; 
  };

  const handleNavStateChange = (navState) => {
    if (navState.url.toLowerCase().includes('success')) {
       Alert.alert('Payment Successful', 'Transaction recorded.');
       setView('DASHBOARD');
    }
  };

  if (view === 'PAYMENT') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
        <StatusBar barStyle="light-content" />
        <View style={styles.browserHeader}>
          <TouchableOpacity onPress={() => setView('DASHBOARD')}>
            <X color="white" size={24} />
          </TouchableOpacity>
          <Text style={styles.browserTitle}>Secure Automation Active</Text>
          <ActivityIndicator color={THEME.gold} size="small" />
        </View>
        <WebView
          source={{ uri: AXIS_URL }}
          injectedJavaScript={getGhostScript(activeCard, amount, activeCard.email, activeCard.phone)}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          onNavigationStateChange={handleNavStateChange}
          javaScriptEnabled
          domStorageEnabled
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
      <View style={styles.header}>
        <Text style={styles.title}>Elite Payer</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setView('FORM')}>
          <Plus color="black" size={24} />
        </TouchableOpacity>
      </View>

      {/* FORM MODAL */}
      <Modal visible={view === 'FORM'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Card</Text>
            <AddCardForm onSave={saveCard} onCancel={() => setView('DASHBOARD')} />
          </View>
        </View>
      </Modal>

      {/* CARD LIST */}
      <View style={{ height: CARD_HEIGHT + 20 }}>
        <Animated.FlatList
          data={cards}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={width}
          decelerationRate="fast"
          contentContainerStyle={{ alignItems: 'center' }}
          onScroll={(e) => (scrollX.value = e.nativeEvent.contentOffset.x)}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <Card 
              item={item} 
              index={index} 
              scrollX={scrollX} 
              onPress={(c) => {
                setActiveCard(c);
                Alert.prompt("Pay Bill", "Enter Amount", [
                    { text: "Cancel", style: "cancel" },
                    { text: "PAY NOW", onPress: (amt) => {
                        if(amt) { setAmount(amt); setView('PAYMENT'); }
                    }}
                ], "plain-text", "", "number-pad");
              }} 
            />
          )}
          ListEmptyComponent={<Text style={{color:'white', textAlign:'center', marginTop:50}}>No Cards. Tap + to add.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

// SUB-COMPONENT: Add Card Form
const AddCardForm = ({ onSave, onCancel }) => {
  const [f, setF] = useState({ bankName: 'Axis Bank', number: '', name: '', expiry: '', email: '', phone: '' });
  return (
    <View style={{ width: '100%' }}>
      <TextInput style={styles.input} placeholder="Bank Name" placeholderTextColor="#666" value={f.bankName} onChangeText={t => setF({...f, bankName: t})} />
      <TextInput style={styles.input} placeholder="Card Number" placeholderTextColor="#666" maxLength={16} keyboardType="number-pad" onChangeText={t => setF({...f, number: t})} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="MM/YY" placeholderTextColor="#666" onChangeText={t => setF({...f, expiry: t})} />
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="CVV" placeholderTextColor="#666" secureTextEntry />
      </View>
      <TextInput style={styles.input} placeholder="Holder Name" placeholderTextColor="#666" onChangeText={t => setF({...f, name: t})} />
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#666" onChangeText={t => setF({...f, email: t})} />
      <TextInput style={styles.input} placeholder="Phone" placeholderTextColor="#666" onChangeText={t => setF({...f, phone: t})} />
      
      <TouchableOpacity style={styles.saveBtn} onPress={() => onSave(f)}>
        <Text style={styles.btnText}>SAVE CARD</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ padding: 15, alignItems: 'center' }} onPress={onCancel}>
        <Text style={{ color: THEME.dim }}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, color: THEME.text, fontWeight: 'bold' },
  addBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: THEME.gold, justifyContent: 'center', alignItems: 'center' },
  cardContainer: { width: CARD_WIDTH, height: CARD_HEIGHT },
  cardInner: { flex: 1, borderRadius: 24, overflow: 'hidden' },
  cardGradient: { flex: 1, padding: 24, justifyContent: 'space-between' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  bankName: { color: THEME.text, fontSize: 18, fontWeight: '700' },
  cardNumber: { color: THEME.text, fontSize: 24, letterSpacing: 3, marginVertical: 10 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: THEME.dim, fontSize: 10, fontWeight: 'bold' },
  value: { color: THEME.text, fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#18181B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, color: THEME.text, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: '#27272A', color: 'white', padding: 16, borderRadius: 12, marginBottom: 12 },
  saveBtn: { backgroundColor: THEME.primary, padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: 'white', fontWeight: 'bold' },
  browserHeader: { flexDirection: 'row', padding: 16, alignItems: 'center', backgroundColor: '#18181B' },
  browserTitle: { color: 'white', flex: 1, textAlign: 'center', fontWeight: 'bold' }
});

 * Scroll to the bottom of the page.
 * Click the green button that says "Commit changes".
Mission 2: The Magic Builder File
Now we need the file that tells GitHub "Make me an APK!"
 * Click "Add file" -> "Create new file" again.
 * Name the file: This part is tricky. You must type the slashes (/). Type exactly:
   .github/workflows/build.yml
   (When you type the slash /, GitHub will automatically make folders. Just keep typing).
 * Paste this Code:
name: Build Android APK
on:
  workflow_dispatch:  # This gives you a button to click

jobs:
  build:
    name: EAS Build
    runs-on: ubuntu-latest
    steps:
      - name: 🏗 Setup Repo
        uses: actions/checkout@v3

      - name: 🏗 Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18.x

      - name: 🏗 Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: 📦 Install Dependencies
        run: npm install

      - name: 🚀 Build APK
        run: eas build --platform android --profile preview --non-interactive --local


