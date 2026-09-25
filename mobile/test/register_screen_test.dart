import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:musicroom_mobile/features/auth/presentation/register_screen.dart';

void main() {
  testWidgets('rejects empty name, invalid email and a short password',
      (tester) async {
    await tester.pumpWidget(const ProviderScope(
      child: MaterialApp(home: RegisterScreen()),
    ));

    await tester.enterText(find.byType(TextFormField).at(1), 'not-an-email');
    await tester.enterText(find.byType(TextFormField).at(2), 'short');
    await tester.tap(find.widgetWithText(FilledButton, 'Sign up'));
    await tester.pump();

    expect(find.text('Required'), findsOneWidget);
    expect(find.text('Enter a valid email'), findsOneWidget);
    expect(find.text('Min. 8 characters'), findsOneWidget);
  });

  testWidgets('accepts valid input and clears validation errors',
      (tester) async {
    await tester.pumpWidget(const ProviderScope(
      child: MaterialApp(home: RegisterScreen()),
    ));

    await tester.enterText(find.byType(TextFormField).at(0), 'Alice');
    await tester.enterText(find.byType(TextFormField).at(1), 'alice@test.com');
    await tester.enterText(find.byType(TextFormField).at(2), 'longenoughpw');
    await tester.pump();

    final formState = tester.state<FormState>(find.byType(Form));
    expect(formState.validate(), isTrue);
  });
}
