// ==========================================
// OrderCard — Order summary with actions
// ==========================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../../constants/theme';
import type { Order, OrderStatus } from '../../types';
import StatusBadge from './StatusBadge';
import MealTimeBadge from './MealTimeBadge';
import { formatTime, getDeliveryTypeLabel, getOrderShortId } from '../../lib/utils';

interface OrderCardProps {
  order: Order;
  onAccept?: () => void;
  onReject?: () => void;
  onUpdateStatus?: (status: OrderStatus) => void;
  onPress?: () => void;
}

export default function OrderCard({ order, onAccept, onReject, onUpdateStatus, onPress }: OrderCardProps) {
  const [countdown, setCountdown] = useState(300); // 5 min auto-reject

  useEffect(() => {
    if (order.status !== 'pending') return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [order.status]);

  const formatCountdown = () => {
    const mins = Math.floor(countdown / 60);
    const secs = countdown % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const nextStatusAction = (): { label: string; status: OrderStatus; color: string } | null => {
    switch (order.status) {
      case 'accepted': return { label: '👨‍🍳 Mark Preparing', status: 'preparing', color: Colors.statusPreparing };
      case 'preparing': return { label: '📦 Mark Ready', status: 'out_for_delivery', color: Colors.statusOutForDelivery };
      case 'out_for_delivery': return { label: '✅ Mark Delivered', status: 'delivered', color: Colors.statusDelivered };
      default: return null;
    }
  };

  const action = nextStatusAction();

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.orderId}>{getOrderShortId(order.id)}</Text>
          <Text style={styles.time}>{formatTime(order.placedAt)}</Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      {/* Customer + Meta */}
      <View style={styles.body}>
        <View style={styles.customerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {order.customerName.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{order.customerName}</Text>
            <Text style={styles.deliveryType}>{getDeliveryTypeLabel(order.deliveryType)}</Text>
          </View>
          <MealTimeBadge mealTime={order.mealTime} size="sm" />
        </View>

        {/* Items */}
        <View style={styles.itemsContainer}>
          {order.items.map((item, idx) => (
            <Text key={idx} style={styles.itemText}>
              {item.quantity}× {item.name}
            </Text>
          ))}
        </View>

        {order.specialNote && (
          <View style={styles.noteContainer}>
            <Text style={styles.noteText}>📝 {order.specialNote}</Text>
          </View>
        )}

        {/* Amount */}
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Total</Text>
          <Text style={styles.amount}>₹{order.totalAmount}</Text>
        </View>
      </View>

      {/* Actions */}
      {order.status === 'pending' && (
        <View style={styles.newOrderActions}>
          <Text style={styles.countdownText}>⏱ {formatCountdown()}</Text>
          <View style={styles.actionRow}>
            <Pressable style={[styles.actionBtn, styles.rejectBtn]} onPress={onReject}>
              <Text style={styles.rejectText}>✕ Reject</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, styles.acceptBtn]} onPress={onAccept}>
              <Text style={styles.acceptText}>✓ Accept</Text>
            </Pressable>
          </View>
        </View>
      )}

      {action && (
        <Pressable
          style={[styles.statusAction, { backgroundColor: action.color }]}
          onPress={() => onUpdateStatus?.(action.status)}
        >
          <Text style={styles.statusActionText}>{action.label}</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  orderId: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  time: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  body: {},
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
  },
  customerName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  deliveryType: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
  },
  itemsContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  itemText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
    marginBottom: 4,
  },
  noteContainer: {
    backgroundColor: Colors.warningBg,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  noteText: {
    fontSize: FontSizes.sm,
    color: Colors.warningDark,
    fontStyle: 'italic',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  amount: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.extrabold,
    color: Colors.textPrimary,
  },
  newOrderActions: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
  },
  countdownText: {
    textAlign: 'center',
    fontSize: FontSizes.sm,
    color: Colors.error,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    backgroundColor: Colors.errorBg,
  },
  rejectText: {
    color: Colors.error,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  acceptBtn: {
    backgroundColor: Colors.success,
  },
  acceptText: {
    color: Colors.textInverse,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  statusAction: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  statusActionText: {
    color: Colors.textInverse,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
});
