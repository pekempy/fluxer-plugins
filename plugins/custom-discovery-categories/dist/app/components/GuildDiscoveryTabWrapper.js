import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { wrapComponent } from '@pekempy/fluxer-plugin-sdk/helpers/app';
import { observer } from 'mobx-react-lite';
import { useFormSubmit } from '@app/features/app/hooks/useFormSubmit';
import * as GuildCommands from '@app/features/guild/commands/GuildCommands';
import { showGuildErrorModal } from '@app/features/guild/components/alerts/GuildErrorModalUtils';
import styles from '@app/features/guild/components/modals/guild_tabs/GuildDiscoveryTab.module.css';
import { TRY_AGAIN_IN_A_MOMENT_DESCRIPTOR } from '@app/features/i18n/utils/CommonMessageDescriptors';
import { Logger } from '@app/features/platform/utils/AppLogger';
import { Button } from '@app/features/ui/button/Button';
import * as ToastCommands from '@app/features/ui/commands/ToastCommands';
import { Form } from '@app/features/ui/components/form/Form';
import { Combobox } from '@app/features/ui/components/form/FormCombobox';
import { Input, Textarea } from '@app/features/ui/components/form/FormInput';
import { Spinner } from '@app/features/ui/components/Spinner';
import { getSortedDiscoveryLanguages } from '@app/features/user/utils/LocaleUtils';
import { useRemoteFormReset } from '@app/lib/forms/RemoteFormReset';
import Discovery from '@app/features/discovery/state/Discovery';
import { DISCOVERY_DEFAULT_LANGUAGE, DISCOVERY_DESCRIPTION_MAX_LENGTH, DISCOVERY_DESCRIPTION_MIN_LENGTH, DISCOVERY_MAX_TAGS, DISCOVERY_TAG_MAX_LENGTH, DiscoveryApplicationStatus, isValidDiscoveryTag, normalizeDiscoveryTag, } from '@fluxer/constants/src/DiscoveryConstants';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { InfoIcon, WarningIcon } from '@phosphor-icons/react';
import { clsx } from 'clsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
const PENDING_DESCRIPTOR = msg({
    message: 'Pending',
    comment: 'Discovery application status badge in the community Discovery settings tab. The application is awaiting staff review.',
});
const APPROVED_DESCRIPTOR = msg({
    message: 'Approved',
    comment: 'Discovery application status badge in the community Discovery settings tab. The community has been approved and is listed.',
});
const REJECTED_DESCRIPTOR = msg({
    message: 'Rejected',
    comment: 'Discovery application status badge in the community Discovery settings tab. The application was declined by staff.',
});
const REMOVED_DESCRIPTOR = msg({
    message: 'Removed',
    comment: 'Discovery application status badge in the community Discovery settings tab. The community was delisted from Discovery.',
});
const DISCOVERY_TAG_REQUIREMENTS_DESCRIPTOR = msg({
    message: 'Tags must be 2 to {maxLength} characters and alphanumeric.',
    comment: 'Discovery custom-tag validation error. maxLength is the maximum allowed tag length.',
});
const DISCOVERY_TAG_LIMIT_DESCRIPTOR = msg({
    message: 'You can only add up to {maxTags} tags.',
    comment: 'Discovery custom-tag validation error. maxTags is the maximum number of custom tags.',
});
const COULDN_T_WITHDRAW_DISCOVERY_APPLICATION_DESCRIPTOR = msg({
    message: "Couldn't withdraw application",
    comment: 'Error modal title shown when withdrawing a community Discovery application fails.',
});
const COULDN_T_ADD_DISCOVERY_TAG_DESCRIPTOR = msg({
    message: "Couldn't add tag",
    comment: 'Error modal title shown when a custom Discovery tag cannot be added.',
});
const A_DESCRIPTION_IS_REQUIRED_DESCRIPTOR = msg({
    message: 'A description is required.',
    comment: 'Inline validation error on the Discovery application form when the description field is empty.',
});
const DESCRIPTION_MUST_BE_AT_LEAST_CHARACTERS_DESCRIPTOR = msg({
    message: 'Description must be at least {discoveryDescriptionMinLength} characters.',
    comment: 'Inline validation error on the Discovery application form when the description is too short. {discoveryDescriptionMinLength} is an integer.',
});
const DESCRIPTION_MUST_BE_NO_MORE_THAN_CHARACTERS_DESCRIPTOR = msg({
    message: 'Description must be no more than {discoveryDescriptionMaxLength} characters.',
    comment: 'Inline validation error on the Discovery application form when the description is too long. {discoveryDescriptionMaxLength} is an integer.',
});
const DESCRIBE_WHAT_YOUR_COMMUNITY_IS_ABOUT_DESCRIPTOR = msg({
    message: 'Describe what your community is about',
    comment: 'Placeholder in the description textarea on the Discovery application form.',
});
const REMOVE_TAG_DESCRIPTOR = msg({
    message: 'Remove tag {tag}',
    comment: 'Accessible label for the per-tag X button in the Discovery tag list. {tag} is the tag text. Used by screen readers.',
});
const ADD_A_TAG_AND_PRESS_ENTER_DESCRIPTOR = msg({
    message: 'Add a tag and press Enter',
    comment: 'Placeholder in the tag input on the Discovery application form. "Enter" refers to the Enter/Return key.',
});
const logger = new Logger('GuildDiscoveryTab');
function getEmptyDiscoveryFormValues() {
    return {
        description: '',
        category_type: 0,
        primary_language: DISCOVERY_DEFAULT_LANGUAGE,
        custom_tags: [],
    };
}
function getDiscoveryApplicationFormValues(application) {
    return {
        description: application.description,
        category_type: application.category_type,
        primary_language: application.primary_language ?? DISCOVERY_DEFAULT_LANGUAGE,
        custom_tags: application.custom_tags ?? [],
    };
}
function StatusBadge({ status }) {
    const { i18n } = useLingui();
    const statusConfig = useMemo(() => ({
        [DiscoveryApplicationStatus.PENDING]: { label: i18n._(PENDING_DESCRIPTOR), className: styles.statusPending },
        [DiscoveryApplicationStatus.APPROVED]: { label: i18n._(APPROVED_DESCRIPTOR), className: styles.statusApproved },
        [DiscoveryApplicationStatus.REJECTED]: { label: i18n._(REJECTED_DESCRIPTOR), className: styles.statusRejected },
        [DiscoveryApplicationStatus.REMOVED]: { label: i18n._(REMOVED_DESCRIPTOR), className: styles.statusRemoved },
    }), [i18n.locale]);
    const config = statusConfig[status];
    if (!config)
        return null;
    return (_jsx("span", { className: clsx(styles.statusBadge, config.className), "data-flx": "guild.guild-tabs.guild-discovery-tab.status-badge.status-badge", children: config.label }));
}
const GuildDiscoveryTabWrapperComponent = observer(({ guildId }) => {
    const { i18n } = useLingui();
    const [status, setStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const categoryOptions = useMemo(() => Discovery.categories.map((c) => ({ value: c.id, label: c.name })), [Discovery.categories]);
    const languageOptions = useMemo(() => getSortedDiscoveryLanguages().map((language) => ({
        value: language.code,
        label: language.label,
    })), [i18n]);
    const [tagInput, setTagInput] = useState('');
    const fetchStatus = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await GuildCommands.getDiscoveryStatus(guildId);
            setStatus(data);
        }
        catch (err) {
            logger.error('Failed to fetch discovery status', err);
        }
        finally {
            setIsLoading(false);
        }
    }, [guildId]);
    useEffect(() => {
        void fetchStatus();
        void Discovery.loadCategories();
    }, [fetchStatus]);
    const application = status?.application ?? null;
    const eligible = status?.eligible ?? false;
    const minMemberCount = status?.min_member_count ?? 0;
    const hasActiveApplication = application != null &&
        (application.status === DiscoveryApplicationStatus.PENDING ||
            application.status === DiscoveryApplicationStatus.APPROVED);
    const canApply = !hasActiveApplication &&
        (application == null ||
            application.status === DiscoveryApplicationStatus.REJECTED ||
            application.status === DiscoveryApplicationStatus.REMOVED);
    const remoteValues = useMemo(() => hasActiveApplication && application
        ? getDiscoveryApplicationFormValues(application)
        : getEmptyDiscoveryFormValues(), [hasActiveApplication, application]);
    const form = useForm({
        defaultValues: getEmptyDiscoveryFormValues(),
    });
    const { commitRemoteValues } = useRemoteFormReset({
        form,
        identityKey: `${guildId}:${hasActiveApplication ? (application?.applied_at ?? 'active') : 'new'}`,
        remoteValues,
    });
    const setApplicationFromResponse = useCallback((response) => {
        setStatus((prev) => (prev ? { ...prev, application: response } : prev));
    }, []);
    const onSubmit = useCallback(async (data) => {
        const payload = {
            description: data.description,
            category_type: data.category_type,
            primary_language: data.primary_language,
            custom_tags: data.custom_tags,
        };
        if (hasActiveApplication) {
            const result = await GuildCommands.updateDiscoveryApplication(guildId, payload);
            setApplicationFromResponse(result);
            commitRemoteValues(getDiscoveryApplicationFormValues(result));
            ToastCommands.createToast({
                type: 'success',
                children: _jsx(Trans, { children: "Discovery listing updated" }),
            });
        }
        else {
            const result = await GuildCommands.applyForDiscovery(guildId, payload);
            setApplicationFromResponse(result);
            commitRemoteValues(getDiscoveryApplicationFormValues(result));
            ToastCommands.createToast({
                type: 'success',
                children: _jsx(Trans, { children: "Discovery application sent" }),
            });
        }
    }, [guildId, hasActiveApplication, form, setApplicationFromResponse]);
    const { handleSubmit, isSubmitting } = useFormSubmit({
        form,
        onSubmit,
        defaultErrorField: 'description',
    });
    const handleWithdraw = useCallback(async () => {
        try {
            setIsWithdrawing(true);
            await GuildCommands.withdrawDiscoveryApplication(guildId);
            setStatus((prev) => (prev ? { ...prev, application: null } : prev));
            commitRemoteValues(getEmptyDiscoveryFormValues());
            ToastCommands.createToast({
                type: 'success',
                children: _jsx(Trans, { children: "Discovery application withdrawn" }),
            });
        }
        catch (err) {
            logger.error('Failed to withdraw discovery application', err);
            showGuildErrorModal({
                title: i18n._(COULDN_T_WITHDRAW_DISCOVERY_APPLICATION_DESCRIPTOR),
                message: i18n._(TRY_AGAIN_IN_A_MOMENT_DESCRIPTOR),
                dataFlx: 'guild.guild-tabs.guild-discovery-tab.withdraw-application-error-modal',
            });
        }
        finally {
            setIsWithdrawing(false);
        }
    }, [guildId, commitRemoteValues, i18n]);
    if (isLoading) {
        return (_jsx("div", { className: styles.spinnerContainer, "data-flx": "guild.guild-tabs.guild-discovery-tab.spinner-container", children: _jsx(Spinner, { "data-flx": "guild.guild-tabs.guild-discovery-tab.spinner" }) }));
    }
    return (_jsxs("div", { className: styles.container, "data-flx": "guild.guild-tabs.guild-discovery-tab.container", children: [_jsxs("div", { className: styles.header, "data-flx": "guild.guild-tabs.guild-discovery-tab.header", children: [_jsx("h2", { className: styles.title, "data-flx": "guild.guild-tabs.guild-discovery-tab.title", children: _jsx(Trans, { children: "Discovery" }) }), _jsx("p", { className: styles.subtitle, "data-flx": "guild.guild-tabs.guild-discovery-tab.subtitle", children: _jsx(Trans, { children: "List your community in Discovery so others can find and join it." }) })] }), !eligible && canApply && (_jsx("div", { className: styles.warning, "data-flx": "guild.guild-tabs.guild-discovery-tab.warning", children: _jsxs("div", { className: styles.warningContent, "data-flx": "guild.guild-tabs.guild-discovery-tab.warning-content", children: [_jsx("div", { className: styles.warningIcon, "data-flx": "guild.guild-tabs.guild-discovery-tab.warning-icon", children: _jsx(WarningIcon, { size: 20, weight: "fill", "data-flx": "guild.guild-tabs.guild-discovery-tab.warning-icon--2" }) }), _jsxs("div", { className: styles.warningBody, "data-flx": "guild.guild-tabs.guild-discovery-tab.warning-body", children: [_jsx("p", { className: styles.warningTitle, "data-flx": "guild.guild-tabs.guild-discovery-tab.warning-title", children: _jsx(Trans, { children: "Not enough members" }) }), _jsx("p", { className: styles.warningText, "data-flx": "guild.guild-tabs.guild-discovery-tab.warning-text", children: _jsxs(Trans, { children: ["Your community needs at least ", minMemberCount, " members before it can be listed in Discovery."] }) })] })] }) })), application != null && (_jsxs("div", { className: styles.statusCard, "data-flx": "guild.guild-tabs.guild-discovery-tab.status-card", children: [_jsxs("div", { className: styles.statusRow, "data-flx": "guild.guild-tabs.guild-discovery-tab.status-row", children: [_jsx("span", { className: styles.statusLabel, "data-flx": "guild.guild-tabs.guild-discovery-tab.status-label", children: _jsx(Trans, { children: "Status:" }) }), _jsx(StatusBadge, { status: application.status, "data-flx": "guild.guild-tabs.guild-discovery-tab.status-badge" })] }), (application.removal_reason ?? application.review_reason) && (_jsx("p", { className: styles.reviewReason, "data-flx": "guild.guild-tabs.guild-discovery-tab.review-reason", children: _jsxs(Trans, { children: ["Reason: ", application.removal_reason ?? application.review_reason] }) }))] })), application?.status === DiscoveryApplicationStatus.APPROVED && (_jsx("div", { className: styles.info, "data-flx": "guild.guild-tabs.guild-discovery-tab.info", children: _jsxs("div", { className: styles.infoContent, "data-flx": "guild.guild-tabs.guild-discovery-tab.info-content", children: [_jsx("div", { className: styles.infoIcon, "data-flx": "guild.guild-tabs.guild-discovery-tab.info-icon", children: _jsx(InfoIcon, { size: 20, weight: "fill", "data-flx": "guild.guild-tabs.guild-discovery-tab.info-icon--2" }) }), _jsx("p", { className: styles.infoText, "data-flx": "guild.guild-tabs.guild-discovery-tab.info-text", children: _jsx(Trans, { children: "Your community is listed in Discovery. You can update your listing details below or withdraw to remove it." }) })] }) })), application?.status === DiscoveryApplicationStatus.PENDING && (_jsx("div", { className: styles.info, "data-flx": "guild.guild-tabs.guild-discovery-tab.info--2", children: _jsxs("div", { className: styles.infoContent, "data-flx": "guild.guild-tabs.guild-discovery-tab.info-content--2", children: [_jsx("div", { className: styles.infoIcon, "data-flx": "guild.guild-tabs.guild-discovery-tab.info-icon--3", children: _jsx(InfoIcon, { size: 20, weight: "fill", "data-flx": "guild.guild-tabs.guild-discovery-tab.info-icon--4" }) }), _jsx("p", { className: styles.infoText, "data-flx": "guild.guild-tabs.guild-discovery-tab.info-text--2", children: _jsx(Trans, { children: "Your application is pending review. You can still update your listing details or withdraw the application." }) })] }) })), (canApply || hasActiveApplication) && (_jsx(Form, { form: form, onSubmit: handleSubmit, "data-flx": "guild.guild-tabs.guild-discovery-tab.form.submit", children: _jsxs("div", { className: styles.formCard, "data-flx": "guild.guild-tabs.guild-discovery-tab.form-card", children: [_jsxs("div", { "data-flx": "guild.guild-tabs.guild-discovery-tab.div", children: [_jsx("div", { className: styles.fieldLabel, "data-flx": "guild.guild-tabs.guild-discovery-tab.field-label", children: _jsx(Trans, { children: "Description" }) }), _jsx(Controller, { name: "description", control: form.control, rules: {
                                        required: i18n._(A_DESCRIPTION_IS_REQUIRED_DESCRIPTOR),
                                        minLength: {
                                            value: DISCOVERY_DESCRIPTION_MIN_LENGTH,
                                            message: i18n._(DESCRIPTION_MUST_BE_AT_LEAST_CHARACTERS_DESCRIPTOR, {
                                                discoveryDescriptionMinLength: DISCOVERY_DESCRIPTION_MIN_LENGTH,
                                            }),
                                        },
                                        maxLength: {
                                            value: DISCOVERY_DESCRIPTION_MAX_LENGTH,
                                            message: i18n._(DESCRIPTION_MUST_BE_NO_MORE_THAN_CHARACTERS_DESCRIPTOR, {
                                                discoveryDescriptionMaxLength: DISCOVERY_DESCRIPTION_MAX_LENGTH,
                                            }),
                                        },
                                    }, render: ({ field, fieldState }) => (_jsx(Textarea, { name: field.name, value: field.value, onChange: field.onChange, onBlur: field.onBlur, ref: field.ref, error: fieldState.error?.message, label: "", placeholder: i18n._(DESCRIBE_WHAT_YOUR_COMMUNITY_IS_ABOUT_DESCRIPTOR), minRows: 3, maxRows: 6, maxLength: DISCOVERY_DESCRIPTION_MAX_LENGTH, showCharacterCount: true, disabled: !eligible && canApply, "data-flx": "guild.guild-tabs.guild-discovery-tab.textarea.change" })), "data-flx": "guild.guild-tabs.guild-discovery-tab.controller" })] }), _jsxs("div", { "data-flx": "guild.guild-tabs.guild-discovery-tab.div--2", children: [_jsx("div", { className: styles.fieldLabel, "data-flx": "guild.guild-tabs.guild-discovery-tab.field-label--2", children: _jsx(Trans, { children: "Category" }) }), _jsx(Controller, { name: "category_type", control: form.control, render: ({ field }) => (_jsx(Combobox, { value: field.value, onChange: field.onChange, options: categoryOptions, isSearchable: false, disabled: !eligible && canApply, "data-flx": "guild.guild-tabs.guild-discovery-tab.select.change" })), "data-flx": "guild.guild-tabs.guild-discovery-tab.controller--2" }), _jsx("p", { className: styles.helpText, "data-flx": "guild.guild-tabs.guild-discovery-tab.help-text", children: _jsx(Trans, { children: "Choose the category that best describes your community. You can change this any time." }) })] }), _jsxs("div", { "data-flx": "guild.guild-tabs.guild-discovery-tab.div--3", children: [_jsx("div", { className: styles.fieldLabel, "data-flx": "guild.guild-tabs.guild-discovery-tab.field-label--3", children: _jsx(Trans, { children: "Primary language" }) }), _jsx(Controller, { name: "primary_language", control: form.control, render: ({ field }) => (_jsx(Combobox, { value: field.value, onChange: field.onChange, options: languageOptions, isSearchable: true, disabled: !eligible && canApply, "data-flx": "guild.guild-tabs.guild-discovery-tab.select.change--2" })), "data-flx": "guild.guild-tabs.guild-discovery-tab.controller--3" }), _jsx("p", { className: styles.helpText, "data-flx": "guild.guild-tabs.guild-discovery-tab.help-text--2", children: _jsx(Trans, { children: "The language most of your community speaks. Used to filter Discovery results." }) })] }), _jsxs("div", { "data-flx": "guild.guild-tabs.guild-discovery-tab.div--4", children: [_jsx("div", { className: styles.fieldLabel, "data-flx": "guild.guild-tabs.guild-discovery-tab.field-label--4", children: _jsx(Trans, { children: "Custom tags" }) }), _jsx(Controller, { name: "custom_tags", control: form.control, render: ({ field }) => {
                                        const tags = field.value ?? [];
                                        const addTag = (rawValue) => {
                                            const value = normalizeDiscoveryTag(rawValue);
                                            if (!value)
                                                return;
                                            if (!isValidDiscoveryTag(value)) {
                                                showGuildErrorModal({
                                                    title: i18n._(COULDN_T_ADD_DISCOVERY_TAG_DESCRIPTOR),
                                                    message: i18n._(DISCOVERY_TAG_REQUIREMENTS_DESCRIPTOR, {
                                                        maxLength: DISCOVERY_TAG_MAX_LENGTH,
                                                    }),
                                                    dataFlx: 'guild.guild-tabs.guild-discovery-tab.invalid-tag-error-modal',
                                                });
                                                return;
                                            }
                                            if (tags.includes(value))
                                                return;
                                            if (tags.length >= DISCOVERY_MAX_TAGS) {
                                                showGuildErrorModal({
                                                    title: i18n._(COULDN_T_ADD_DISCOVERY_TAG_DESCRIPTOR),
                                                    message: i18n._(DISCOVERY_TAG_LIMIT_DESCRIPTOR, { maxTags: DISCOVERY_MAX_TAGS }),
                                                    dataFlx: 'guild.guild-tabs.guild-discovery-tab.tag-limit-error-modal',
                                                });
                                                return;
                                            }
                                            field.onChange([...tags, value]);
                                            setTagInput('');
                                        };
                                        const removeTag = (tag) => {
                                            field.onChange(tags.filter((t) => t !== tag));
                                        };
                                        return (_jsxs("div", { className: styles.tagsField, "data-flx": "guild.guild-tabs.guild-discovery-tab.tags-field", children: [_jsx("div", { className: styles.tagsList, "data-flx": "guild.guild-tabs.guild-discovery-tab.tags-list", children: tags.map((tag) => (_jsxs("span", { className: styles.tagChip, "data-flx": "guild.guild-tabs.guild-discovery-tab.tag-chip", children: [tag, _jsx("button", { type: "button", "aria-label": i18n._(REMOVE_TAG_DESCRIPTOR, { tag }), className: styles.tagChipRemove, onClick: () => removeTag(tag), disabled: !eligible && canApply, "data-flx": "guild.guild-tabs.guild-discovery-tab.tag-chip-remove.remove-tag.button", children: "\u00D7" })] }, tag))) }), _jsxs("div", { className: styles.tagsInputRow, "data-flx": "guild.guild-tabs.guild-discovery-tab.tags-input-row", children: [_jsx(Input, { value: tagInput, onChange: (e) => setTagInput(e.target.value), onKeyDown: (e) => {
                                                                if (e.key === 'Enter' || e.key === ',') {
                                                                    e.preventDefault();
                                                                    addTag(tagInput);
                                                                }
                                                                else if (e.key === 'Backspace' && tagInput.length === 0 && tags.length > 0) {
                                                                    removeTag(tags[tags.length - 1]);
                                                                }
                                                            }, maxLength: DISCOVERY_TAG_MAX_LENGTH, placeholder: i18n._(ADD_A_TAG_AND_PRESS_ENTER_DESCRIPTOR), disabled: (!eligible && canApply) || tags.length >= DISCOVERY_MAX_TAGS, "data-flx": "guild.guild-tabs.guild-discovery-tab.input" }), _jsx(Button, { type: "button", small: true, variant: "secondary", onClick: () => addTag(tagInput), disabled: (!eligible && canApply) || tags.length >= DISCOVERY_MAX_TAGS || tagInput.trim().length === 0, "data-flx": "guild.guild-tabs.guild-discovery-tab.button.add-tag", children: _jsx(Trans, { children: "Add" }) })] })] }));
                                    }, "data-flx": "guild.guild-tabs.guild-discovery-tab.controller--4" }), _jsx("p", { className: styles.helpText, "data-flx": "guild.guild-tabs.guild-discovery-tab.help-text--3", children: _jsxs(Trans, { children: ["Up to ", DISCOVERY_MAX_TAGS, " tags help people find your community. They show up in Discovery search."] }) })] }), _jsxs("div", { className: styles.actions, "data-flx": "guild.guild-tabs.guild-discovery-tab.actions", children: [hasActiveApplication && (_jsx(Button, { type: "button", variant: "danger", onClick: handleWithdraw, submitting: isWithdrawing, "data-flx": "guild.guild-tabs.guild-discovery-tab.button.withdraw", children: _jsx(Trans, { children: "Withdraw" }) })), _jsx(Button, { type: "submit", submitting: isSubmitting, disabled: !eligible && canApply, "data-flx": "guild.guild-tabs.guild-discovery-tab.button.submit", children: hasActiveApplication ? _jsx(Trans, { children: "Save" }) : _jsx(Trans, { children: "Apply" }) })] })] }) }))] }));
});
const GuildDiscoveryTabWrapper = ({ OriginalComponent, ...props }) => {
    return _jsx(GuildDiscoveryTabWrapperComponent, { ...props });
};
export default wrapComponent(GuildDiscoveryTabWrapper);
//# sourceMappingURL=GuildDiscoveryTabWrapper.js.map