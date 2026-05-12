import React, { useState } from 'react';
import { Modal, Text, TextStyle, TouchableOpacity, View } from 'react-native';
import { findGlossaryEntry, GlossaryEntry } from '../../data/glossary';

type Token = { text: string; entry: GlossaryEntry | null };

function tokenize(text: string): Token[] {
  return text.split(/(\s+)/).map(chunk => ({
    text: chunk,
    entry: /^\s+$/.test(chunk) ? null : findGlossaryEntry(chunk),
  }));
}

type Props = {
  text: string;
  style?: TextStyle;
};

export default function QuestionText({ text, style }: Props) {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<GlossaryEntry | null>(null);
  const tokens = tokenize(text);
  const hasHighlights = tokens.some(t => t.entry !== null);

  return (
    <>
      <Text style={style}>
        {tokens.map((token, i) =>
          token.entry ? (
            <Text
              key={i}
              style={{ color: '#d97706', textDecorationLine: 'underline', fontWeight: '700' }}
              onPress={() => { setActive(token.entry); setVisible(true); }}
              suppressHighlighting
            >
              {token.text}
            </Text>
          ) : (
            <Text key={i}>{token.text}</Text>
          )
        )}
      </Text>

      {hasHighlights && (
        <Text style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 10 }}>
          💡 Altı çizili kelimelere dokun
        </Text>
      )}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View
            style={{
              backgroundColor: 'white',
              margin: 16,
              marginBottom: 36,
              borderRadius: 24,
              padding: 24,
            }}
            onStartShouldSetResponder={() => true}
          >
            <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 }}>
              SÖZLÜK
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 12 }}>
              {active?.term}
            </Text>
            <Text style={{ fontSize: 15, color: '#475569', lineHeight: 23 }}>
              {active?.definition}
            </Text>
            <TouchableOpacity
              onPress={() => setVisible(false)}
              style={{
                marginTop: 20,
                alignSelf: 'flex-end',
                paddingHorizontal: 22,
                paddingVertical: 10,
                backgroundColor: '#f1f5f9',
                borderRadius: 12,
              }}
            >
              <Text style={{ fontWeight: '700', color: '#64748b' }}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
