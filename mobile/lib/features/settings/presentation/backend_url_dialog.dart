import 'package:flutter/material.dart';

import '../../../core/config/app_config.dart';

Future<bool> editBackendUrl(BuildContext context) async {
  final controller = TextEditingController(text: AppConfig.instance.backendUrl);
  final saved = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Backend URL'),
      content: TextField(
        controller: controller,
        autofocus: true,
        keyboardType: TextInputType.url,
        decoration:
            const InputDecoration(helperText: 'e.g. http://192.168.1.20:3000'),
      ),
      actions: [
        TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel')),
        FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Save')),
      ],
    ),
  );
  if (saved == true) await AppConfig.instance.setBackendUrl(controller.text);
  controller.dispose();
  return saved == true;
}
